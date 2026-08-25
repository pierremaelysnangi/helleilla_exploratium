/**
 * Tests unitaires de GET /api/bands/[id]/media et PUT /api/bands/[id]/refs.
 * Le resolver est mocké pour le GET ; DB/Redis mockés pour le PUT :
 * vérifie RBAC, 404, validation des providers, invalidation du cache.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockSession,
  setUser,
  mkReq,
  ctx,
} from "@/lib/api/__tests__/route-helpers";

vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

// Resolver espion (le module réel appellerait les providers externes).
const resolverMock = vi.hoisted(() => ({
  resolveBandMedia: vi.fn(),
  invalidateBandMedia: vi.fn(),
}));
vi.mock("@/lib/media/resolver", () => ({
  resolveBandMedia: resolverMock.resolveBandMedia,
  invalidateBandMedia: resolverMock.invalidateBandMedia,
}));

const bandsMock = vi.hoisted(() => ({
  getBandById: vi.fn(),
  setExternalRefs: vi.fn(),
}));
vi.mock("@/db/queries/bands", () => ({ getBandById: bandsMock.getBandById }));
vi.mock("@/db/mutations/externalRefs", () => ({
  setExternalRefs: bandsMock.setExternalRefs,
}));

// Imports dynamiques après les mocks.
const { GET: getMedia } = await import("./[id]/media/route");
const { PUT: putRefs } = await import("./[id]/refs/route");

const ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("GET /api/bands/[id]/media", () => {
  it("200 avec le DTO média résolu", async () => {
    resolverMock.resolveBandMedia.mockResolvedValue({
      band: { id: ID, name: "Emperor" },
      degraded: false,
    });
    const res = await getMedia(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.band.name).toBe("Emperor");
  });

  it("404 si groupe introuvable", async () => {
    resolverMock.resolveBandMedia.mockRejectedValue(
      new Error("Groupe introuvable : x"),
    );
    const res = await getMedia(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(404);
  });

  it("force la résolution fraîche avec ?refresh=1", async () => {
    resolverMock.resolveBandMedia.mockResolvedValue({ degraded: false });
    await getMedia(mkReq("http://localhost/x?refresh=1"), ctx({ id: ID }));
    expect(resolverMock.resolveBandMedia).toHaveBeenCalledWith(ID, {
      force: true,
    });
  });
});

describe("PUT /api/bands/[id]/refs", () => {
  it("401 sans session", async () => {
    const res = await putRefs(
      mkReq("http://localhost/x", "PUT", {
        refs: [{ provider: "musicbrainz", externalId: "mb-1" }],
      }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(401);
    expect(bandsMock.setExternalRefs).not.toHaveBeenCalled();
  });

  it("403 pour un simple user", async () => {
    setUser("user");
    const res = await putRefs(
      mkReq("http://localhost/x", "PUT", { refs: [] }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
  });

  it("200 pour un contributor : sync + invalidation cache média", async () => {
    setUser("contributor");
    bandsMock.getBandById.mockResolvedValue({ id: ID });
    const res = await putRefs(
      mkReq("http://localhost/x", "PUT", {
        refs: [
          { provider: "musicbrainz", externalId: "mb-1" },
          { provider: "spotify", externalId: "sp-abc" },
        ],
      }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect(bandsMock.setExternalRefs).toHaveBeenCalledWith("band", ID, [
      { provider: "musicbrainz", externalId: "mb-1" },
      { provider: "spotify", externalId: "sp-abc" },
    ]);
    expect(resolverMock.invalidateBandMedia).toHaveBeenCalledWith(ID);
  });

  it("422 si provider inconnu (hors enum)", async () => {
    setUser("contributor");
    const res = await putRefs(
      mkReq("http://localhost/x", "PUT", {
        refs: [{ provider: "myspace", externalId: "x" }],
      }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(422);
    expect(bandsMock.setExternalRefs).not.toHaveBeenCalled();
  });
});
