/**
 * E2E — Recherche globale /api/search, bout en bout.
 * Parcours réel : création d'un groupe via l'API -> indexation
 * asynchrone par le worker BullMQ dans Meilisearch -> requête de
 * recherche jusqu'à voir le document. Vérifie aussi la validation des
 * query params et la disparition après suppression.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { signIn } from "./helpers/api";
import type { ApiClient } from "./helpers/api";
import { bandPayload } from "./helpers/fixtures";
import { TEST_USERS } from "./config";

/** Attend qu'une condition devienne vraie (polling régulier). */
async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  { timeoutMs = 30_000, everyMs = 500 } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await fn();
    if (predicate(value)) return value;
    if (Date.now() > deadline) {
      throw new Error("pollUntil : condition non remplie avant timeout");
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
}

let admin: ApiClient;

beforeAll(async () => {
  admin = await signIn(TEST_USERS.admin.email, TEST_USERS.admin.password);
});

describe("GET /api/search", () => {
  const band = bandPayload(`Searchable-${Date.now()}`);
  let bandId: string;

  it("422 sans terme q", async () => {
    const { status } = await admin.get("/api/search");
    expect(status).toBe(422);
  });

  it("indexe un groupe créé puis le trouve via la recherche", async () => {
    // 1. Création via l'API publique
    const created = await admin.post<{ data: { id: string } }>(
      "/api/bands",
      band,
    );
    expect(created.status).toBe(201);
    bandId = created.json.data.id;

    try {
      // 2. Polling : le worker BullMQ doit indexer le document dans
      //    Meilisearch sous quelques secondes
      const result = await pollUntil(
        () =>
          admin.get<{
            data: { bands: { name: string; slug: string }[] };
          }>(`/api/search?q=${encodeURIComponent(band.name)}`),
        (res) => res.status === 200 && res.json.data.bands.length > 0,
      );

      const hit = result.json.data.bands[0];
      expect(hit.name).toBe(band.name);
      expect(hit.slug).toBe(band.slug);
    } finally {
      // 3. Nettoyage garanti même si la recherche échoue
      await admin.delete(`/api/bands/${bandId}`).catch(() => undefined);
    }
  });

  it("retire le groupe de l'index après suppression", async () => {
    // La suppression du test précédent a déclenché un job "delete" ;
    // on attend que le document disparaisse de l'index.
    await pollUntil(
      () =>
        admin.get<{ data: { bands: unknown[] } }>(
          `/api/search?q=${encodeURIComponent(band.name)}`,
        ),
      (res) => res.json.data.bands.length === 0,
      { timeoutMs: 45_000 },
    );
    expect(true).toBe(true);
  });

  it("respecte la limite par index (limit=2)", async () => {
    const { status, json } = await admin.get<{
      data: { bands: unknown[]; albums: unknown[]; tracks: unknown[] };
    }>("/api/search?q=metal&limit=2");
    expect(status).toBe(200);
    // Chaque tableau respecte au plus `limit` résultats
    expect(json.data.bands.length).toBeLessThanOrEqual(2);
    expect(json.data.albums.length).toBeLessThanOrEqual(2);
    expect(json.data.tracks.length).toBeLessThanOrEqual(2);
  });
});
