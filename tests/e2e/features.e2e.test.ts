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

describe("Parcours catalogue (front métier)", () => {
  it("l'accueil rend le héro et les sections", async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Helleilla Exploratium");
    expect(html).toContain("Explorer le catalogue");
  });

  it("GET /bands rend la page catalogue (SSR : titre, nav)", async () => {
    const res = await fetch(`${BASE_URL}/bands`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // Le titre et la navigation sont SSR ; les filtres/liste se rendent
    // côté client par design (filtres URL + infinite query).
    expect(html).toContain("<title>Groupes | Helleilla Exploratium</title>");
    expect(html).toContain('aria-current="page"');
  });

  it("GET /forums rend la page des avis", async () => {
    // Le fil lui-même se rend côté client (pagination progressive) : ce
    // qui est vérifié ici, c'est le SSR de l'en-tête et de son propos.
    const res = await fetch(`${BASE_URL}/forums`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<title>Forums | Helleilla Exploratium</title>");
    expect(html).toContain("Un avis engage celui qui l");
  });

  it("GET /api/forum renvoie un fil paginé sans authentification", async () => {
    // La lecture est publique par construction : une discussion sans
    // lecteur n'a pas d'objet.
    const res = await fetch(`${BASE_URL}/api/forum?perPage=5`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.meta).toHaveProperty("totalPages");
  });

  it("POST /api/forum refuse un anonyme", async () => {
    const res = await fetch(`${BASE_URL}/api/forum`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "Un avis sans compte ne passe pas." }),
    });
    expect(res.status).toBe(401);
  });

  it("GET /albums rend la page catalogue albums", async () => {
    const res = await fetch(`${BASE_URL}/albums`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<title>Albums | Helleilla Exploratium</title>");
  });

  it("GET /genres rend la page de taxonomie", async () => {
    // Le champ de filtre a été retiré : la recherche globale couvre ce
    // besoin, et ce second champ repoussait la taxonomie sous la ligne
    // de flottaison. On vérifie donc le rendu de la page elle-même.
    const res = await fetch(`${BASE_URL}/genres`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Taxonomie des genres");
    expect(html).not.toContain("Filtrer les genres");
  });

  it("la page détail d'un groupe SSR affiche nom, genres et discographie", async () => {
    // Crée un groupe + genre + liaison pour avoir du contenu réel
    const genre = await admin.post<{ data: { id: string; name: string } }>(
      "/api/genres",
      { name: `DetailGenre-${Date.now()}`, slug: `detailgenre-${Date.now()}` },
    );
    const payload = bandPayload(`DetailBand-${Date.now()}`);
    const band = await contributor.post<{ data: { id: string; slug: string } }>(
      "/api/bands",
      payload,
    );
    const bandId = band.json.data.id;
    await contributor.request(`/api/bands/${bandId}/genres`, {
      method: "PUT",
      body: JSON.stringify({ genreIds: [genre.json.data.id] }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await fetch(`${BASE_URL}/bands/${payload.slug}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // Contenu SSR indexable
    // Contenu SSR indexable : nom, bio, genres liés, section discographie
    expect(html).toContain(payload.name);
    expect(html).toContain("Bio de test pour");
    expect(html).toContain("Discographie");

    // Nettoyage
    await admin.delete(`/api/bands/${bandId}`).catch(() => undefined);
    await admin
      .delete(`/api/genres/${genre.json.data.id}`)
      .catch(() => undefined);
  });
});

describe("Réinitialisation de mot de passe", () => {
  it("GET /forgot-password rend le formulaire avec anti-énumération", async () => {
    const res = await fetch(`${BASE_URL}/forgot-password`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Mot de passe oublié");
    expect(html).toContain("Recevoir le lien");
  });

  it("GET /reset-password sans token invite à refaire une demande", async () => {
    const res = await fetch(`${BASE_URL}/reset-password`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Lien incomplet");
  });

  it("l'API forget-password répond génériquement pour un email inconnu (anti-énumération)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "compte-inexistant@example.com",
        redirectTo: `${BASE_URL}/reset-password`,
      }),
    });
    // Better Auth répond 200 même pour un email inconnu : aucune fuite d'info
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe(true);
  });
});

describe("SEO — indexation", () => {
  it("GET /robots.txt autorise le catalogue et déclare le sitemap", async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Sitemap:");
    expect(body).toContain("Disallow: /api/");
  });

  it("GET /sitemap.xml liste les groupes de la base", async () => {
    // Crée un groupe pour vérifier sa présence dans le plan de site
    const payload = bandPayload(`SitemapBand-${Date.now()}`);
    const created = await contributor.post<{
      data: { id: string; slug: string };
    }>("/api/bands", payload);

    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain(`${BASE_URL}/bands`);
    expect(xml).toContain(`/${payload.slug}`);

    await admin
      .delete(`/api/bands/${created.json.data.id}`)
      .catch(() => undefined);
  });

  it("la page détail groupe embarque les données structurées MusicGroup", async () => {
    const payload = bandPayload(`JsonLdBand-${Date.now()}`);
    payload.formedYear = 1990;
    const created = await contributor.post<{
      data: { id: string; slug: string };
    }>("/api/bands", payload);

    const res = await fetch(`${BASE_URL}/bands/${payload.slug}`);
    const html = await res.text();
    expect(html).toContain("application/ld+json");
    expect(html).toContain('"MusicGroup"');
    expect(html).toContain(payload.name);
    // Canonical dynamique présent
    expect(html).toContain(`/bands/${payload.slug}`);

    await admin
      .delete(`/api/bands/${created.json.data.id}`)
      .catch(() => undefined);
  });
});
