/**
 * Tests des Server Actions band (lib/actions/band.ts).
 * Vérifie la matrice RBAC pour création (contributor+), modification
 * (contributor+) et suppression (moderator+ uniquement), avec les codes
 * d'erreur attendus ("Non authentifié." / "Permission refusée.").
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach } from "vitest";
// Actions sous test
import { createBandAction, updateBandAction, deleteBandAction } from "./band";

// Conteneur hoisté partagé entre les tests et le mock de @/lib/auth
const mockSession = vi.hoisted(() => ({ current: null as any }));

// next/headers throw hors contexte Next
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock de l'authentification : renvoie la session configurée par setUser()
vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: vi.fn(async () => mockSession.current) },
  },
}));

// Mocks des mutations DB bands : renvoient un objet fusionné minimal
vi.mock("@/db/mutations/bands", () => ({
  createBand: vi.fn(async (d: any) => ({ id: "fake-id", slug: "fake", ...d })),
  updateBand: vi.fn(async (id: string, d: any) => ({ id, slug: "fake", ...d })),
  deleteBand: vi.fn(async () => undefined),
}));

// Mocks des requêtes DB : groupes, albums et pistes (descendance)
vi.mock("@/db/queries/bands", () => ({
  getBandById: vi.fn(async (id: string) => ({
    id,
    name: "Existing",
    slug: "existing",
    imageUrl: null,
  })),
}));

vi.mock("@/db/queries/albums", () => ({
  listAlbumIdsByBandId: vi.fn(async () => []),
}));

vi.mock("@/db/queries/tracks", () => ({
  listTrackIdsByAlbumIds: vi.fn(async () => []),
}));

// Mock du stockage d'images : upload factice renvoyant une URL
vi.mock("@/lib/storage/images", () => ({
  uploadImage: vi.fn(async () => "http://fake/img.webp"),
  deleteImage: vi.fn(async () => undefined),
}));

// Mocks des files d'indexation : no-op (pas de Redis en test)
vi.mock("@/lib/queue/jobs/index-band", () => ({
  enqueueBandIndex: vi.fn(async () => undefined),
}));
vi.mock("@/lib/queue/jobs/index-album", () => ({
  enqueueAlbumIndex: vi.fn(async () => undefined),
}));
vi.mock("@/lib/queue/jobs/index-track", () => ({
  enqueueTrackIndex: vi.fn(async () => undefined),
}));

/** Configure la session simulée (null = visiteur anonyme). */
function setUser(role: string | null) {
  mockSession.current = role
    ? { user: { id: "u1", email: "t@t.local", role }, session: { id: "s1" } }
    : null;
}

/** Fabrique un FormData de création de groupe, avec champs surchargeables. */
function bandForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("name", "Necrofrost");
  fd.set("slug", "necrofrost");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

// Réinitialise les espions entre chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

// Création : contributor et admin autorisés
describe("createBandAction — RBAC", () => {
  it("refuse si non authentifié", async () => {
    setUser(null);
    const res = await createBandAction(bandForm());
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toBe("Non authentifié.");
  });

  it("refuse pour un user", async () => {
    setUser("user");
    const res = await createBandAction(bandForm());
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toBe("Permission refusée.");
  });

  it("autorise pour un contributor", async () => {
    setUser("contributor");
    const res = await createBandAction(bandForm());
    expect(res.success).toBe(true);
  });

  it("autorise pour un admin", async () => {
    setUser("admin");
    const res = await createBandAction(bandForm());
    expect(res.success).toBe(true);
  });
});

// Modification : contributor et admin autorisés
describe("updateBandAction — RBAC", () => {
  it("refuse pour un user", async () => {
    setUser("user");
    const res = await updateBandAction(
      bandForm({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toBe("Permission refusée.");
  });

  it("autorise pour un contributor", async () => {
    setUser("contributor");
    const res = await updateBandAction(
      bandForm({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    );
    expect(res.success).toBe(true);
  });
});

// Suppression : moderator et admin uniquement
describe("deleteBandAction — RBAC", () => {
  it("refuse pour un user", async () => {
    setUser("user");
    const res = await deleteBandAction("fake-id");
    expect(res.success).toBe(false);
  });

  it("refuse pour un contributor", async () => {
    setUser("contributor");
    const res = await deleteBandAction("fake-id");
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toBe("Permission refusée.");
  });

  it("autorise pour un moderator", async () => {
    setUser("moderator");
    const res = await deleteBandAction("fake-id");
    expect(res.success).toBe(true);
  });
});
