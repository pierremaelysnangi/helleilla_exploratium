/**
 * E2E — Cycle de vie CRUD complet sur serveur réel (Postgres + Drizzle).
 * Parcours : création band -> album -> piste, lecture, mise à jour,
 * listes paginées, puis suppression en cascade (la suppression du groupe
 * doit emporter album et pistes via les FK ON DELETE CASCADE).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { signIn } from "./helpers/api";
import type { ApiClient } from "./helpers/api";
import {
  bandPayload,
  albumPayload,
  trackPayload,
  genrePayload,
} from "./helpers/fixtures";
import { TEST_USERS } from "./config";

// Clients partagés par la suite (créés une fois, connectés au seed)
let admin: ApiClient;

/** Entités créées pendant la suite, à nettoyer même en cas d'échec. */
const created = {
  bandIds: [] as string[],
  genreIds: [] as string[],
};

beforeAll(async () => {
  admin = await signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
});

// Nettoyage best-effort après la suite
afterAll(async () => {
  for (const id of created.genreIds) {
    await admin.delete(`/api/genres/${id}`).catch(() => undefined);
  }
  for (const id of created.bandIds) {
    await admin.delete(`/api/bands/${id}`).catch(() => undefined);
  }
});

describe("Cycle band -> album -> track", () => {
  let bandId: string;
  let albumId: string;
  let trackId: string;
  const band = bandPayload();

  it("POST /api/bands crée un groupe (201)", async () => {
    const { status, json } = await admin.post<{
      data: { id: string; name: string };
    }>("/api/bands", band);
    expect(status).toBe(201);
    expect(json.data.name).toBe(band.name);
    bandId = json.data.id;
    created.bandIds.push(bandId);
  });

  it("GET /api/bands/:id lit le groupe créé", async () => {
    const { status, json } = await admin.get<{
      data: { name: string; formedYear: number | null };
    }>(`/api/bands/${bandId}`);
    expect(status).toBe(200);
    expect(json.data.formedYear).toBe(band.formedYear);
  });

  it("PATCH /api/bands/:id met à jour le groupe", async () => {
    const { status, json } = await admin.patch<{
      data: { bio: string };
    }>(`/api/bands/${bandId}`, { bio: "Bio mise à jour e2e" });
    expect(status).toBe(200);
    expect(json.data.bio).toBe("Bio mise à jour e2e");
  });

  it("GET /api/bands liste paginée contient le groupe", async () => {
    const { status, json } = await admin.get<{
      data: { id: string }[];
      meta: { page: number; totalPages: number };
    }>("/api/bands?page=1&perPage=50");
    expect(status).toBe(200);
    expect(json.data.some((b) => b.id === bandId)).toBe(true);
    expect(json.meta.page).toBe(1);
  });

  it("POST /api/albums crée un album rattaché (201)", async () => {
    const payload = albumPayload(bandId);
    const { status, json } = await admin.post<{ data: { id: string } }>(
      "/api/albums",
      payload,
    );
    expect(status).toBe(201);
    albumId = json.data.id;
  });

  it("POST /api/tracks crée une piste rattachée (201)", async () => {
    const payload = trackPayload(albumId);
    const { status, json } = await admin.post<{ data: { id: string } }>(
      "/api/tracks",
      payload,
    );
    expect(status).toBe(201);
    trackId = json.data.id;
  });

  it("GET /api/tracks/:id lit la piste créée", async () => {
    const { status } = await admin.get(`/api/tracks/${trackId}`);
    expect(status).toBe(200);
  });

  it("DELETE /api/bands/:id cascade sur albums et pistes", async () => {
    const del = await admin.delete<{ data?: { deleted?: boolean } }>(
      `/api/bands/${bandId}`,
    );
    expect(del.status).toBe(200);

    // L'album et la piste ont été supprimés par la cascade SQL
    const albumGone = await admin.get(`/api/albums/${albumId}`);
    expect(albumGone.status).toBe(404);
    const trackGone = await admin.get(`/api/tracks/${trackId}`);
    expect(trackGone.status).toBe(404);

    // Retiré du suivi de nettoyage
    created.bandIds = created.bandIds.filter((id) => id !== bandId);
  });

  it("DELETE /api/bands/:id renvoie 404 une seconde fois", async () => {
    const res = await admin.delete(`/api/bands/${bandId}`);
    expect(res.status).toBe(404);
  });
});

describe("Cycle genre", () => {
  const genre = genrePayload();
  let genreId: string;

  it("POST /api/genres crée un genre (201)", async () => {
    const { status, json } = await admin.post<{ data: { id: string } }>(
      "/api/genres",
      genre,
    );
    expect(status).toBe(201);
    genreId = json.data.id;
    created.genreIds.push(genreId);
  });

  it("PATCH /api/genres/:id met à jour le nom", async () => {
    const renamed = { name: `${genre.name}-v2` };
    const { status, json } = await admin.patch<{ data: { name: string } }>(
      `/api/genres/${genreId}`,
      renamed,
    );
    expect(status).toBe(200);
    expect(json.data.name).toBe(renamed.name);
  });

  it("GET /api/genres liste paginée contient le genre", async () => {
    const { status, json } = await admin.get<{
      data: { id: string }[];
    }>("/api/genres?perPage=100");
    expect(status).toBe(200);
    expect(json.data.some((g) => g.id === genreId)).toBe(true);
  });
});
