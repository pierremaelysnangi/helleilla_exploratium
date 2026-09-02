/**
 * Tests des Server Actions genre (lib/actions/genre.ts).
 * Vérifie la matrice RBAC (création/modification réservées à moderator+,
 * suppression à admin), le refus avant toute requête DB et la gestion
 * des genres introuvables.
 */
// lib/actions/genre.test.ts
// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach } from "vitest";
// Actions sous test
import {
  createGenreAction,
  updateGenreAction,
  deleteGenreAction,
} from "./genre";
// Helpers partagés : session mockée et assertions
import {
  mockSession,
  setUser,
  expectAllowed,
  expectDenied,
  fieldErrorsOf,
} from "./__tests__/helpers";

// Mocks des modules Next.js inutilisables hors rendu (headers, cache)
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
// Mock de l'authentification : renvoie la session configurée par setUser()
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

// Mocks des mutations DB genres : renvoient un objet fusionné minimal
vi.mock("@/db/mutations/genres", () => ({
  createGenre: vi.fn(async (d: any) => ({
    id: "genre-new",
    slug: "fake-genre",
    ...d,
  })),
  updateGenre: vi.fn(async (id: string, d: any) => ({
    id,
    slug: "fake-genre",
    ...d,
  })),
  deleteGenre: vi.fn(async () => undefined),
}));

vi.mock("@/db/queries/genres", () => ({
  getGenreById: vi.fn(async (id: string) => ({
    id,
    name: "Existing Genre",
    slug: "existing-genre",
  })),
}));

// Réinitialise les espions entre chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

/** Fabrique un FormData de création de genre, avec champs surchargeables. */
function genreForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("name", "Blackened Death Metal");
  fd.set("slug", "blackened-death-metal");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

/** Fabrique un FormData de modification de genre (avec id), surchargeable. */
function genreUpdateForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("id", "550e8400-e29b-41d4-a716-446655440004");
  fd.set("name", "Blackened Death Metal");
  fd.set("slug", "blackened-death-metal");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

// Suite principale : matrice des permissions sur les actions genre
describe("genre — RBAC", () => {
  it("non authentifié refusé", async () => {
    setUser(null);
    expectDenied(await createGenreAction(genreForm()));
  });

  it("user ne peut pas créer", async () => {
    setUser("user");
    expectDenied(await createGenreAction(genreForm()));
  });

  it("contributor ne peut pas créer", async () => {
    setUser("contributor");
    expectDenied(await createGenreAction(genreForm()));
  });

  it("moderator peut créer", async () => {
    setUser("moderator");
    expectAllowed(await createGenreAction(genreForm()));
  });

  it("moderator peut modifier", async () => {
    setUser("moderator");
    expectAllowed(await updateGenreAction(genreUpdateForm()));
  });

  it("moderator ne peut pas supprimer", async () => {
    setUser("moderator");
    expectDenied(
      await deleteGenreAction("550e8400-e29b-41d4-a716-446655440004"),
    );
  });

  it("admin peut supprimer", async () => {
    setUser("admin");
    expectAllowed(
      await deleteGenreAction("550e8400-e29b-41d4-a716-446655440004"),
    );
  });

  // Le garde RBAC doit bloquer avant la lecture en base
  it("refuse AVANT toute requête DB", async () => {
    const { getGenreById } = await import("@/db/queries/genres");
    setUser("user");
    await updateGenreAction(genreUpdateForm());
    expect(getGenreById).not.toHaveBeenCalled();
  });

  it("update : renvoie erreur si genre introuvable", async () => {
    const { getGenreById } = await import("@/db/queries/genres");
    vi.mocked(getGenreById).mockResolvedValueOnce(undefined as any);
    setUser("moderator");
    expectDenied(await updateGenreAction(genreUpdateForm()));
  });

  it("delete : renvoie erreur si genre introuvable", async () => {
    const { getGenreById } = await import("@/db/queries/genres");
    vi.mocked(getGenreById).mockResolvedValueOnce(undefined as any);
    setUser("admin");
    expectDenied(
      await deleteGenreAction("550e8400-e29b-41d4-a716-446655440004"),
    );
  });
});

// Validation zod et invalidation de cache
describe("genre — validation et revalidation", () => {
  it("create : renvoie les erreurs zod pour un slug non kebab-case", async () => {
    setUser("moderator");
    const res = await createGenreAction(genreForm({ slug: "Pas Un Slug" }));
    expect(fieldErrorsOf(res).slug).toBeDefined();
  });

  it("update : renvoie les erreurs zod pour un id non-UUID", async () => {
    setUser("moderator");
    const res = await updateGenreAction(genreUpdateForm({ id: "pas-un-uuid" }));
    expect(fieldErrorsOf(res).id).toBeDefined();
  });

  it("update : n'invalide pas l'ancienne URL quand le slug est inchangé", async () => {
    const { getGenreById } = await import("@/db/queries/genres");
    const { revalidatePath } = await import("next/cache");
    // updateGenre renvoie le slug soumis : on fait renvoyer le même à la
    // lecture pour simuler une modification qui ne touche pas au slug.
    vi.mocked(getGenreById).mockResolvedValueOnce({
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "Existing Genre",
      slug: "blackened-death-metal",
    } as any);
    setUser("moderator");

    expectAllowed(await updateGenreAction(genreUpdateForm()));

    // /genres + /genres/<slug>, sans troisième purge de l'ancien slug
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });
});
