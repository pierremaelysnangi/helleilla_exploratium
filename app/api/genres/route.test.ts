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

const dbMock = vi.hoisted(() => ({ select: vi.fn(), insert: vi.fn() }));
vi.mock("@/db", () => ({ db: dbMock }));

const { POST } = await import("./route");

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("POST /api/genres — RBAC durci", () => {
  const valid = { name: "Black Metal", slug: "black-metal" };

  it("403 pour un contributor", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/genres", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(403);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("201 pour un moderator", async () => {
    setUser("moderator");
    dbMock.insert.mockReturnValue(chain([{ id: "g1", ...valid }]));
    const res = await POST(
      mkReq("http://localhost/api/genres", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(201);
  });
});
