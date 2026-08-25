/**
 * Tests des Server Actions track (lib/actions/track.ts).
 * Vérifie la matrice RBAC (refus anonyme/user, autorisation contributor
 * en création/modification, suppression réservée à moderator+).
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, vi, beforeEach } from "vitest";
// Actions sous test
import {
  createTrackAction,
  updateTrackAction,
  deleteTrackAction,
} from "./track";
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

// Mocks des mutations DB tracks : renvoient un objet fusionné minimal
vi.mock("@/db/mutations/tracks", () => ({
  createTrack: vi.fn(async (d: any) => ({ id: "track-new", ...d })),
  updateTrack: vi.fn(async (id: string, d: any) => ({ id, ...d })),
  deleteTrack: vi.fn(async () => undefined),
}));

// Mocks des requêtes DB : albums et pistes (avec album joint)
vi.mock("@/db/queries/albums", () => ({
  getAlbumById: vi.fn(async (id: string) => ({
    id,
    bandId: "550e8400-e29b-41d4-a716-446655440001",
    title: "Existing Album",
    slug: "existing-album",
    coverUrl: null,
  })),
}));

vi.mock("@/db/queries/tracks", () => ({
  getTrackById: vi.fn(async (id: string) => ({
    id,
    albumId: "550e8400-e29b-41d4-a716-446655440002",
    title: "Existing Track",
    trackNumber: 1,
  })),
  getTrackWithAlbum: vi.fn(async (id: string) => ({
    id,
    albumId: "550e8400-e29b-41d4-a716-446655440002",
    title: "Existing Track",
    trackNumber: 1,
    album: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      slug: "existing-album",
      band: { id: "550e8400-e29b-41d4-a716-446655440001", slug: "fake-band" },
    },
  })),
}));

// Mock du stockage audio (non utilisé par les actions testées ici)
vi.mock("@/lib/storage/audio", () => ({
  uploadAudio: vi.fn(async () => "http://fake/track.mp3"),
  deleteAudio: vi.fn(async () => undefined),
}));

// Mock de la file d'indexation : no-op (pas de Redis en test)
vi.mock("@/lib/queue/jobs/index-track", () => ({
  enqueueTrackIndex: vi.fn(async () => undefined),
}));

// Réinitialise les espions entre chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

// Suite principale : matrice des permissions sur les actions track
describe("album — RBAC", () => {
  it("user ne peut pas créer", async () => {
    setUser("user");
    expectDenied(await createTrackAction(fixtures.track()));
  });

  it("contributor peut créer", async () => {
    setUser("contributor");
    expectAllowed(await createTrackAction(fixtures.track()));
  });

  it("contributor peut modifier", async () => {
    setUser("contributor");
    expectAllowed(await updateTrackAction(fixtures.trackUpdate()));
  });

  it("contributor ne peut pas supprimer", async () => {
    setUser("contributor");
    expectDenied(
      await deleteTrackAction("550e8400-e29b-41d4-a716-446655440003"),
    );
  });

  it("moderator peut supprimer", async () => {
    setUser("moderator");
    expectAllowed(
      await deleteTrackAction("550e8400-e29b-41d4-a716-446655440003"),
    );
  });

  it("non authentifié refusé", async () => {
    setUser(null);
    expectDenied(await createTrackAction(fixtures.track()));
  });
});
