/**
 * E2E — Matrice RBAC appliquée par les routes API réelles.
 * Reproduit les règles de lib/rbac/permissions.ts via HTTP :
 * anonyme -> 401, user (lecture seule) -> 403 en écriture,
 * contributor -> create/update OK mais delete interdit,
 * moderator -> delete entités OK mais pas delete genre, admin -> tout.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { anonymous, signIn } from "./helpers/api";
import type { ApiClient } from "./helpers/api";
import { bandPayload, genrePayload } from "./helpers/fixtures";
import { TEST_USERS } from "./config";

let anon: ApiClient;
let user: ApiClient;
let contributor: ApiClient;
let moderator: ApiClient;
let admin: ApiClient;

/** Band créée par le contributor, cible des tests de suppression. */
let targetBandId: string;
/** Genre créé par le moderator, cible du test admin-only delete. */
let targetGenreId: string;

beforeAll(async () => {
  anon = anonymous();
  [user, contributor, moderator, admin] = await Promise.all([
    signIn(TEST_USERS.user.email, TEST_USERS.user.password),
    signIn(TEST_USERS.contributor.email, TEST_USERS.contributor.password),
    signIn(TEST_USERS.moderator.email, TEST_USERS.moderator.password),
    signIn(TEST_USERS.admin.email, TEST_USERS.admin.password),
  ]);
});

afterAll(async () => {
  // Nettoyage best-effort des entités encore présentes
  if (targetBandId)
    await admin.delete(`/api/bands/${targetBandId}`).catch(() => undefined);
  if (targetGenreId)
    await admin.delete(`/api/genres/${targetGenreId}`).catch(() => undefined);
});

describe("Lecture publique", () => {
  it("GET /api/bands est accessible sans session", async () => {
    const { status } = await anon.get("/api/bands");
    expect(status).toBe(200);
  });
});

describe("Création de groupe", () => {
  it("401 pour un anonyme", async () => {
    const { status } = await anon.post("/api/bands", bandPayload());
    expect(status).toBe(401);
  });

  it("403 pour un simple utilisateur", async () => {
    const { status } = await user.post("/api/bands", bandPayload());
    expect(status).toBe(403);
  });

  it("201 pour un contributor", async () => {
    const payload = bandPayload();
    const res = await contributor.post<{ data: { id: string } }>(
      "/api/bands",
      payload,
    );
    expect(res.status).toBe(201);
    targetBandId = res.json.data.id;
  });
});

describe("Suppression de groupe", () => {
  it("403 pour le contributor propriétaire de l'action", async () => {
    const { status } = await contributor.delete(`/api/bands/${targetBandId}`);
    expect(status).toBe(403);
  });

  it("200 pour un moderator", async () => {
    const { status } = await moderator.delete<{ data?: { deleted?: boolean } }>(
      `/api/bands/${targetBandId}`,
    );
    expect(status).toBe(200);
    targetBandId = ""; // déjà supprimée
  });
});

describe("Genres (RBAC durci)", () => {
  it("403 pour un contributor", async () => {
    const { status } = await contributor.post("/api/genres", genrePayload());
    expect(status).toBe(403);
  });

  it("201 pour un moderator", async () => {
    const res = await moderator.post<{ data: { id: string } }>(
      "/api/genres",
      genrePayload(),
    );
    expect(res.status).toBe(201);
    targetGenreId = res.json.data.id;
  });

  it("DELETE genre : 403 pour un moderator", async () => {
    const { status } = await moderator.delete(`/api/genres/${targetGenreId}`);
    expect(status).toBe(403);
  });

  it("DELETE genre : 200 pour un admin", async () => {
    const { status } = await admin.delete<{ data?: { deleted?: boolean } }>(
      `/api/genres/${targetGenreId}`,
    );
    expect(status).toBe(200);
    targetGenreId = "";
  });
});
