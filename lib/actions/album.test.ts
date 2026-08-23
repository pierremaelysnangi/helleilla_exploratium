import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAlbumAction,
  updateAlbumAction,
  deleteAlbumAction,
} from "./album";
import {
  mockSession,
  setUser,
  expectAllowed,
  expectDenied,
  fixtures,
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

vi.mock("@/lib/storage/images", () => ({
  uploadImage: vi.fn(async () => "http://fake/img.webp"),
  deleteImage: vi.fn(async () => undefined),
}));

vi.mock("@/lib/queue/jobs/index-album", () => ({
  enqueueAlbumIndex: vi.fn(async () => undefined),
}));
vi.mock("@/lib/queue/jobs/index-track", () => ({
  enqueueTrackIndex: vi.fn(async () => undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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
