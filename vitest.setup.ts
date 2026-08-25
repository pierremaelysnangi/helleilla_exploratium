// vitest.setup.ts
import { vi } from "vitest";

const state = vi.hoisted(() => ({ session: null as any }));

export const mockSession = state;

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => state.session) } },
}));

vi.mock("@/lib/storage/images", () => ({
  uploadImage: vi.fn(async () => "http://fake/img.webp"),
  deleteImage: vi.fn(async () => undefined),
}));

vi.mock("@/lib/queue/jobs/index-band", () => ({
  enqueueBandIndex: vi.fn(async () => undefined),
}));
vi.mock("@/lib/queue/jobs/index-album", () => ({
  enqueueAlbumIndex: vi.fn(async () => undefined),
}));
vi.mock("@/lib/queue/jobs/index-track", () => ({
  enqueueTrackIndex: vi.fn(async () => undefined),
}));
// Embeddings : no-op en tests unitaires (le vrai job est testé à part)
vi.mock("@/lib/queue/jobs/generate-embeddings", () => ({
  enqueueEmbeddings: vi.fn(async () => undefined),
  buildBandEmbeddingText: (band: { name: string }) => band.name,
}));

// next/cache : revalidateTag manquait pour /api/revalidate
vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return { ...actual, revalidateTag: vi.fn() };
});

vi.mock("@/lib/api/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/rate-limit")>();
  return {
    ...actual,
    rateLimit: vi.fn().mockResolvedValue(null), // jamais limité par défaut
  };
});
