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
  insert: vi.fn(),
}));
vi.mock("@/db", () => ({ db: dbMock }));

const queueMock = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({ trackIndexQueue: queueMock }));

const { GET, POST } = await import("./route");

const ALBUM_ID = "00000000-0000-4000-8000-0000000000a1";
const TRACK_ID = "00000000-0000-4000-8000-000000000091";

const validTrack = {
  albumId: ALBUM_ID,
  title: "Slottet i det fjerne",
  trackNumber: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("GET /api/tracks", () => {
  it("200 + pagination", async () => {
    dbMock.select
      .mockReturnValueOnce(
        chain([{ id: TRACK_ID, title: "Slottet i det fjerne" }]),
      )
      .mockReturnValueOnce(chain([{ count: 1 }]));
    const res = await GET(mkReq("http://localhost/api/tracks"), ctx());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
  });

  it("422 si page invalide", async () => {
    const res = await GET(mkReq("http://localhost/api/tracks?page=0"), ctx());
    expect(res.status).toBe(422);
    expect(dbMock.select).not.toHaveBeenCalled();
  });
});

describe("POST /api/tracks", () => {
  it("401 si non authentifié", async () => {
    const res = await POST(
      mkReq("http://localhost/api/tracks", "POST", validTrack),
      ctx(),
    );
    expect(res.status).toBe(401);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("403 pour un user simple", async () => {
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/api/tracks", "POST", validTrack),
      ctx(),
    );
    expect(res.status).toBe(403);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("201 pour un contributor + indexation", async () => {
    setUser("contributor");
    dbMock.insert.mockReturnValue(chain([{ id: TRACK_ID, ...validTrack }]));
    const res = await POST(
      mkReq("http://localhost/api/tracks", "POST", validTrack),
      ctx(),
    );
    expect(res.status).toBe(201);
    expect(queueMock.add).toHaveBeenCalledWith("index", {
      trackId: TRACK_ID,
      action: "index",
    });
  });

  it("422 si trackNumber négatif", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/tracks", "POST", {
        ...validTrack,
        trackNumber: -1,
      }),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("422 si audioUrl invalide", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/tracks", "POST", {
        ...validTrack,
        audioUrl: "pas-une-url",
      }),
      ctx(),
    );
    expect(res.status).toBe(422);
  });
});
