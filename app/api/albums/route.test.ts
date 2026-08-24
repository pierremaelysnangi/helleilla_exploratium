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
vi.mock("@/lib/queue/client", () => ({ albumIndexQueue: queueMock }));

const { GET, POST } = await import("./route");

const BAND_ID = "00000000-0000-4000-8000-0000000000b1";
const ALBUM_ID = "00000000-0000-4000-8000-0000000000a1";

const validAlbum = {
  bandId: BAND_ID,
  title: "Transilvanian Hunger",
  slug: "transilvanian-hunger",
  type: "album",
  releaseYear: 1994,
};

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("GET /api/albums", () => {
  it("200 + pagination", async () => {
    dbMock.select
      .mockReturnValueOnce(
        chain([{ id: ALBUM_ID, title: "Transilvanian Hunger" }]),
      )
      .mockReturnValueOnce(chain([{ count: 1 }]));
    const res = await GET(mkReq("http://localhost/api/albums"), ctx());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
  });

  it("422 si perPage invalide", async () => {
    const res = await GET(
      mkReq("http://localhost/api/albums?perPage=9999"),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(dbMock.select).not.toHaveBeenCalled();
  });
});

describe("POST /api/albums", () => {
  it("401 si non authentifié", async () => {
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", validAlbum),
      ctx(),
    );
    expect(res.status).toBe(401);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("403 pour un user simple", async () => {
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", validAlbum),
      ctx(),
    );
    expect(res.status).toBe(403);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("201 pour un contributor + indexation", async () => {
    setUser("contributor");
    dbMock.insert.mockReturnValue(chain([{ id: ALBUM_ID, ...validAlbum }]));
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", validAlbum),
      ctx(),
    );
    expect(res.status).toBe(201);
    expect(queueMock.add).toHaveBeenCalledWith("index", {
      albumId: ALBUM_ID,
      action: "index",
    });
  });

  it("422 si bandId non-uuid", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", {
        ...validAlbum,
        bandId: "nope",
      }),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("422 si slug pas en kebab-case", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", {
        ...validAlbum,
        slug: "Pas Kebab",
      }),
      ctx(),
    );
    expect(res.status).toBe(422);
  });
});
