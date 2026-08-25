/**
 * Tests des Server Actions album (lib/actions/album.ts).
 * Vérifie la matrice RBAC (refus anonyme/user, autorisation contributor,
 * suppression réservée à moderator+) et le fait que le refus intervient
 * AVANT toute requête base de données.
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach } from "vitest";
// Actions sous test
import {
  createAlbumAction,
  updateAlbumAction,
  deleteAlbumAction,
} from "./album";
// Helpers partagés : session mockée, assertions et fixtures FormData
import {
  mockSession,
  setUser,
  expectAllowed,
  expectDenied,
  fixtures,
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

// Mocks des mutations DB albums : renvoient un objet fusionné minimal
vi.mock("@/db/mutations/albums", () => ({
  createAlbum: vi.fn(async (d: any) => ({
    id: "album-new",
    slug: "fake",
    ...d,
  })),
  updateAlbum: vi.fn(async (id: string, d: any) => ({
    id,
    slug: "fake",
    ...d,
  })),
  deleteAlbum: vi.fn(async () => undefined),
}));

// Mocks des requêtes DB : groupes, albums et pistes d'un album
vi.mock("@/db/queries/bands", () => ({
  getBandById: vi.fn(async (id: string) => ({
    id,
    name: "Fake Band",
    slug: "fake-band",
    imageUrl: null,
  })),
}));

vi.mock("@/db/queries/albums", () => ({
  getAlbumById: vi.fn(async (id: string) => ({
    id,
    bandId: "550e8400-e29b-41d4-a716-446655440001",
    title: "Existing",
    slug: "existing",
    coverUrl: null,
  })),
}));

vi.mock("@/db/queries/tracks", () => ({
  listTrackIdsByAlbumId: vi.fn(async () => ["track-1", "track-2"]),
}));

// Mock du stockage d'images : upload factice renvoyant une URL
vi.mock("@/lib/storage/images", () => ({
  uploadImage: vi.fn(async () => "http://fake/img.webp"),
  deleteImage: vi.fn(async () => undefined),
}));

// Mocks des files d'indexation : no-op (pas de Redis en test)
vi.mock("@/lib/queue/jobs/index-album", () => ({
  enqueueAlbumIndex: vi.fn(async () => undefined),
}));
vi.mock("@/lib/queue/jobs/index-track", () => ({
  enqueueTrackIndex: vi.fn(async () => undefined),
}));

// Réinitialise les espions entre chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

// Suite principale : matrice des permissions sur les actions album
describe("album — RBAC", () => {
  it("user ne peut pas créer", async () => {
    setUser("user");
    expectDenied(await createAlbumAction(fixtures.album()));
  });

  it("contributor peut créer", async () => {
    setUser("contributor");
    expectAllowed(await createAlbumAction(fixtures.album()));
  });

  it("contributor peut modifier", async () => {
    setUser("contributor");
    expectAllowed(await updateAlbumAction(fixtures.albumUpdate()));
  });

  it("contributor ne peut pas supprimer", async () => {
    setUser("contributor");
    expectDenied(
      await deleteAlbumAction("550e8400-e29b-41d4-a716-446655440002"),
    );
  });

  it("moderator peut supprimer", async () => {
    setUser("moderator");
    expectAllowed(
      await deleteAlbumAction("550e8400-e29b-41d4-a716-446655440002"),
    );
  });

  // Le garde RBAC doit bloquer avant la collecte des pistes en base
  it("refuse AVANT toute requête DB", async () => {
    const { listTrackIdsByAlbumId } = await import("@/db/queries/tracks");
    setUser("user");
    await deleteAlbumAction("550e8400-e29b-41d4-a716-446655440002");
    expect(listTrackIdsByAlbumId).not.toHaveBeenCalled();
  });

  it("non authentifié refusé", async () => {
    setUser(null);
    expectDenied(await createAlbumAction(fixtures.album()));
  });
});
