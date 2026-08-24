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

const queueMock = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({ bandIndexQueue: queueMock }));

const { GET, PATCH, DELETE } = await import("./route");

const ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("GET /api/bands/[id]", () => {
  it("200 si trouvé", async () => {
    dbMock.select.mockReturnValue(chain([{ id: ID, name: "Darkthrone" }]));
    const res = await GET(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.name).toBe("Darkthrone");
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

describe("PATCH /api/bands/[id]", () => {
  it("403 pour un user simple", async () => {
    setUser("user");
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { name: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("200 pour un contributor + réindexation", async () => {
    setUser("contributor");
    dbMock.update.mockReturnValue(chain([{ id: ID, name: "X" }]));
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { name: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect(queueMock.add).toHaveBeenCalledWith("index", {
      bandId: ID,
      action: "index",
    });
  });

  it("404 si aucune ligne mise à jour", async () => {
    setUser("contributor");
    dbMock.update.mockReturnValue(chain([]));
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { name: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(404);
    expect(queueMock.add).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/bands/[id]", () => {
  it("403 pour un contributor", async () => {
    setUser("contributor");
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  it("200 pour un moderator + job de suppression", async () => {
    setUser("moderator");
    dbMock.delete.mockReturnValue(chain([{ id: ID }]));
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ deleted: true });
    expect(queueMock.add).toHaveBeenCalledWith("delete", {
      bandId: ID,
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
  });
});
