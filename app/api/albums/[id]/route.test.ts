import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockSession,
  setUser,
  mkReq,
  ctx,
  chain,
} from "@/lib/api/__tests__/route-helpers";

vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/db", () => ({ db: dbMock }));

const albumQueue = vi.hoisted(() => ({ add: vi.fn() }));
const trackQueue = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({
  albumIndexQueue: albumQueue,
  trackIndexQueue: trackQueue,
}));

const queriesMock = vi.hoisted(() => ({
  listTrackIdsByAlbumId: vi.fn(async () => [] as string[]),
}));
vi.mock("@/db/queries/tracks", () => queriesMock);

const { GET, PATCH, DELETE } = await import("./route");

const ID = "00000000-0000-4000-8000-0000000000a1";
const T1 = "00000000-0000-4000-8000-0000000000t1".replace(/t/g, "9");
const T2 = "00000000-0000-4000-8000-0000000000t2".replace(/t/g, "9");

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
  queriesMock.listTrackIdsByAlbumId.mockResolvedValue([]);
});

describe("GET /api/albums/[id]", () => {
  it("200 si trouvé", async () => {
    dbMock.select.mockReturnValue(
      chain([{ id: ID, title: "Transilvanian Hunger" }]),
    );
    const res = await GET(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.title).toBe("Transilvanian Hunger");
  });

  it("404 si absent", async () => {
    dbMock.select.mockReturnValue(chain([]));
    const res = await GET(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(404);
  });

  it("422 si id non-uuid", async () => {
    const res = await GET(mkReq(), ctx({ id: "pas-un-uuid" }));
    expect(res.status).toBe(422);
    expect(dbMock.select).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/albums/[id]", () => {
  it("403 pour un user simple", async () => {
    setUser("user");
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { title: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("200 pour un contributor + réindexation", async () => {
    setUser("contributor");
    dbMock.update.mockReturnValue(chain([{ id: ID, title: "X" }]));
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { title: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect(albumQueue.add).toHaveBeenCalledWith("index", {
      albumId: ID,
      action: "index",
    });
  });

  it("404 si aucune ligne mise à jour", async () => {
    setUser("contributor");
    dbMock.update.mockReturnValue(chain([]));
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { title: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(404);
    expect(albumQueue.add).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/albums/[id]", () => {
  it("403 pour un contributor", async () => {
    setUser("contributor");
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
    expect(dbMock.delete).not.toHaveBeenCalled();
    expect(queriesMock.listTrackIdsByAlbumId).not.toHaveBeenCalled();
  });

  it("200 pour un moderator + cascade des jobs tracks", async () => {
    setUser("moderator");
    queriesMock.listTrackIdsByAlbumId.mockResolvedValue([T1, T2]);
    dbMock.delete.mockReturnValue(chain([{ id: ID }]));
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ deleted: true });
    expect(albumQueue.add).toHaveBeenCalledWith("delete", {
      albumId: ID,
      action: "delete",
    });
    expect(trackQueue.add).toHaveBeenCalledTimes(2);
    expect(trackQueue.add).toHaveBeenCalledWith("delete", {
      trackId: T1,
      action: "delete",
    });
  });

  it("404 si absent", async () => {
    setUser("moderator");
    dbMock.delete.mockReturnValue(chain([]));
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(404);
    expect(albumQueue.add).not.toHaveBeenCalled();
  });
});
