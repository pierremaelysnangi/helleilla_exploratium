// lib/actions/genre.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGenreAction,
  updateGenreAction,
  deleteGenreAction,
} from "./genre";
import {
  mockSession,
  setUser,
  expectAllowed,
  expectDenied,
} from "./__tests__/helpers";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

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

beforeEach(() => {
  vi.clearAllMocks();
});

function genreForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("name", "Blackened Death Metal");
  fd.set("slug", "blackened-death-metal");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

function genreUpdateForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("id", "550e8400-e29b-41d4-a716-446655440004");
  fd.set("name", "Blackened Death Metal");
  fd.set("slug", "blackened-death-metal");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

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
