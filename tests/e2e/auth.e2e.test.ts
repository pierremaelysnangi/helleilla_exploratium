/**
 * E2E — Authentification Better Auth sur serveur réel.
 * Vérifie le refus de mauvais identifiants, l'obtention de session par
 * cookie et la lecture de la session via /api/auth/get-session.
 */
import { describe, it, expect } from "vitest";
import { ApiClient, anonymous, signIn } from "./helpers/api";
import { TEST_USERS } from "./config";

describe("POST /api/auth/sign-in/email", () => {
  it("refuse un mot de passe incorrect (401)", async () => {
    const res = await anonymous().request("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({
        email: TEST_USERS.user.email,
        password: "wrong-password-123",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("délivre un cookie de session pour des identifiants valides", async () => {
    const client = await signIn(
      TEST_USERS.user.email,
      TEST_USERS.user.password,
    );
    // Un cookie de session a bien été capturé
    expect(client.cookieHeader).toContain("session");
  });
});

describe("GET /api/auth/get-session", () => {
  it("renvoie null sans cookie de session", async () => {
    const { status, json } = await anonymous().get<unknown>(
      "/api/auth/get-session",
    );
    expect(status).toBe(200);
    expect(json).toBeNull();
  });

  it("renvoie l'utilisateur connecté avec son rôle", async () => {
    const client = await signIn(
      TEST_USERS.contributor.email,
      TEST_USERS.contributor.password,
    );
    const { status, json } = await client.get<{
      user?: { email?: string; role?: string };
    }>("/api/auth/get-session");

    expect(status).toBe(200);
    expect(json?.user?.email).toBe(TEST_USERS.contributor.email);
    expect(json?.user?.role).toBe("contributor");
  });

  it("un client fraîchement instancié ne partage pas la session", async () => {
    // Garantie d'étanchéité du cookie jar entre clients
    const fresh = new ApiClient();
    const { json } = await fresh.get<unknown>("/api/auth/get-session");
    expect(json).toBeNull();
  });
});
