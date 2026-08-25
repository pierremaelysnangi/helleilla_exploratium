/**
 * E2E — Endpoints additionnels : santé, relation band<->genres et
 * lecture par slug. Vérifie le comportement réel des nouvelles routes
 * contre PostgreSQL (contrainte FK) et le cache Next.js.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { anonymous, signIn } from "./helpers/api";
import type { ApiClient } from "./helpers/api";
import { bandPayload } from "./helpers/fixtures";
import { BASE_URL, TEST_USERS } from "./config";

let anon: ApiClient;
let contributor: ApiClient;
let admin: ApiClient;

/** Genre et band créés par la suite, nettoyés en fin de run. */
let genreId: string;
let bandId: string;

beforeAll(async () => {
  anon = anonymous();
  [contributor, admin] = await Promise.all([
    signIn(TEST_USERS.contributor.email, TEST_USERS.contributor.password),
    signIn(TEST_USERS.admin.email, TEST_USERS.admin.password),
  ]);
});

afterAll(async () => {
  if (bandId) await admin.delete(`/api/bands/${bandId}`).catch(() => undefined);
  if (genreId)
    await admin.delete(`/api/genres/${genreId}`).catch(() => undefined);
});

describe("GET /api/health", () => {
  it("répond 200 healthy avec les trois dépendances", async () => {
    const res = await fetch(
      `${process.env.E2E_BASE_URL ?? "http://localhost:3100"}/api/health`,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("healthy");
    expect(json.data.dependencies.postgres.status).toBe("up");
    expect(json.data.dependencies.redis.status).toBe("up");
    expect(json.data.dependencies.meilisearch.status).toBe("up");
  });
});

describe("PUT /api/bands/:id/genres + GET by-slug", () => {
  it("401 pour un anonyme sur la sync des genres", async () => {
    // bandId encore vide : on teste seulement la couche auth
    const res = await anon.request(
      "/api/bands/00000000-0000-4000-8000-000000000009/genres",
      {
        method: "PUT",
        body: JSON.stringify({ genreIds: [] }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(res.status).toBe(401);
  });

  it("associe des genres à un groupe puis les relit par slug", async () => {
    // Création d'un genre et d'un groupe
    const genre = await admin.post<{ data: { id: string; slug: string } }>(
      "/api/genres",
      { name: `E2EGenre-${Date.now()}`, slug: `e2egenre-${Date.now()}` },
    );
    expect(genre.status).toBe(201);
    genreId = genre.json.data.id;

    const band = bandPayload(`GenreLinked-${Date.now()}`);
    const created = await contributor.post<{
      data: { id: string; slug: string };
    }>("/api/bands", band);
    expect(created.status).toBe(201);
    bandId = created.json.data.id;

    // Sync des genres (contributor a band:update)
    const putRes = await contributor.request(`/api/bands/${bandId}/genres`, {
      method: "PUT",
      body: JSON.stringify({ genreIds: [genreId] }),
      headers: { "Content-Type": "application/json" },
    });
    expect(putRes.status).toBe(200);

    // Le détail par UUID expose le genre
    const detail = await admin.get<{
      data: { genres: { id: string }[] };
    }>(`/api/bands/${bandId}`);
    expect(detail.json.data.genres.map((g) => g.id)).toEqual([genreId]);

    // Lecture publique par slug : même projection
    const bySlug = await anon.get<{
      data: { slug: string; genres: { name: string }[] };
    }>(`/api/bands/by-slug/${band.slug}`);
    expect(bySlug.status).toBe(200);
    expect(bySlug.json.data.slug).toBe(band.slug);
    expect(bySlug.json.data.genres[0].name).toContain("E2EGenre");
  });

  it("422 si un genreId est inconnu (violation FK mappée)", async () => {
    const unknownGenre = "99999999-9999-4999-8999-999999999999";
    const res = await contributor.request(`/api/bands/${bandId}/genres`, {
      method: "PUT",
      body: JSON.stringify({ genreIds: [unknownGenre] }),
      headers: { "Content-Type": "application/json" },
    });
    // La violation FK est convertie en 422 VALIDATION (et non 500)
    expect(res.status).toBe(422);
  });
});

describe("Pages d'authentification", () => {
  it("GET /sign-up rend le formulaire avec générateur et Turnstile", async () => {
    const res = await fetch(`${BASE_URL}/sign-up`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // Champs du formulaire d'inscription
    expect(html).toContain('id="name"');
    expect(html).toContain('id="email"');
    expect(html).toContain("Générer");
    expect(html).toContain("Créer mon compte");
  });

  it("GET /sign-in rend le formulaire de connexion", async () => {
    const res = await fetch(`${BASE_URL}/sign-in`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Se connecter");
    expect(html).toContain('name="password"');
  });
});
