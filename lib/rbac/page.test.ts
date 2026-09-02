/**
 * Tests des gardes RBAC de page (lib/rbac/page.ts).
 *
 * L'invariant central n'est pas « refuser », c'est de distinguer deux
 * situations : un visiteur anonyme est renvoyé vers la connexion, alors
 * qu'un utilisateur connecté sans le droit ne doit PAS l'être — il
 * s'authentifierait pour revenir sur le même refus.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// redirect() lève en vrai : le mock reproduit ce contrat, sans quoi le
// code situé après une redirection s'exécuterait dans les tests.
const nav = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    const err = new Error("NEXT_REDIRECT") as Error & { digest: string };
    err.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  }),
}));
vi.mock("next/navigation", () => ({ redirect: nav.redirect }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

const session = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => session.current) } },
}));

import {
  getPageSession,
  requirePageSession,
  requirePagePermission,
} from "./page";

/** Configure la session simulée ; `undefined` = utilisateur sans rôle. */
function setUser(role: string | null | undefined, id = "u1") {
  if (role === null) {
    session.current = null;
    return;
  }
  session.current = { user: { id, ...(role ? { role } : {}) } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPageSession", () => {
  it("renvoie null pour un visiteur anonyme", async () => {
    setUser(null);
    await expect(getPageSession()).resolves.toBeNull();
  });

  it("expose l'identifiant et le rôle de la session", async () => {
    setUser("moderator", "u42");
    await expect(getPageSession()).resolves.toEqual({
      userId: "u42",
      role: "moderator",
    });
  });

  it("retombe sur « user » quand la session ne porte pas de rôle", async () => {
    // Repli défensif : un compte dont le rôle n'a pas été projeté ne doit
    // jamais hériter d'un privilège par défaut.
    setUser(undefined);
    await expect(getPageSession()).resolves.toEqual({
      userId: "u1",
      role: "user",
    });
  });
});

describe("requirePageSession", () => {
  it("redirige un visiteur anonyme vers la connexion", async () => {
    setUser(null);

    await expect(requirePageSession("/contributions")).rejects.toThrowError(
      /NEXT_REDIRECT/,
    );
    expect(nav.redirect).toHaveBeenCalledWith(
      "/sign-in?callbackUrl=%2Fcontributions",
    );
  });

  it("encode le chemin de retour", async () => {
    setUser(null);

    await expect(
      requirePageSession("/contributions/mes-dossiers"),
    ).rejects.toThrowError(/NEXT_REDIRECT/);
    expect(nav.redirect).toHaveBeenCalledWith(
      "/sign-in?callbackUrl=%2Fcontributions%2Fmes-dossiers",
    );
  });

  it("laisse passer un utilisateur connecté", async () => {
    setUser("user");

    await expect(requirePageSession("/x")).resolves.toEqual({
      userId: "u1",
      role: "user",
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });
});

describe("requirePagePermission", () => {
  it("renvoie la session quand la permission est accordée", async () => {
    setUser("contributor");

    await expect(
      requirePagePermission("contribution", "create", "/contributions"),
    ).resolves.toEqual({ userId: "u1", role: "contributor" });
  });

  it("renvoie null — et NE redirige PAS — sans le droit requis", async () => {
    setUser("user");

    const result = await requirePagePermission(
      "contribution",
      "create",
      "/contributions",
    );

    expect(result).toBeNull();
    // Renvoyer vers /sign-in un utilisateur déjà connecté serait une
    // impasse : il reviendrait au même refus. La page doit expliquer.
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it("redirige tout de même un visiteur anonyme", async () => {
    setUser(null);

    await expect(
      requirePagePermission("contribution", "moderate", "/x"),
    ).rejects.toThrowError(/NEXT_REDIRECT/);
  });

  it("réserve la modération aux modérateurs et administrateurs", async () => {
    setUser("moderator");
    await expect(
      requirePagePermission("contribution", "moderate", "/x"),
    ).resolves.not.toBeNull();

    setUser("contributor");
    await expect(
      requirePagePermission("contribution", "moderate", "/x"),
    ).resolves.toBeNull();
  });
});
