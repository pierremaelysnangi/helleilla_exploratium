import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { route } from "./handler";
import { NextRequest } from "next/server";

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: () => mockGetSession() } },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("./rate-limit", () => ({
  rateLimit: async () => null,
  clientIp: () => "127.0.0.1",
}));

const mkReq = (
  url = "http://localhost/api/test",
  method = "GET",
  body?: unknown,
) =>
  new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const noParams = { params: Promise.resolve({}) };

describe("route handler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 sans session", async () => {
    mockGetSession.mockResolvedValue(null);
    const h = route({ auth: true }, async () => new Response("ok"));
    expect((await h(mkReq(), noParams)).status).toBe(401);
  });

  it("403 sans permission", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const h = route(
      { permission: { resource: "band", action: "delete" } },
      async () => new Response("ok"),
    );
    expect((await h(mkReq(), noParams)).status).toBe(403);
  });

  it("422 body invalide", async () => {
    const h = route(
      { body: z.object({ name: z.string().min(3) }) },
      async () => new Response("ok"),
    );
    const res = await h(
      mkReq("http://localhost/api/test", "POST", { name: "a" }),
      noParams,
    );
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("VALIDATION");
  });

  it("coerce la query", async () => {
    const h = route(
      { query: z.object({ page: z.coerce.number() }) },
      async ({ query }) => Response.json({ page: query.page }),
    );
    const res = await h(mkReq("http://localhost/api/test?page=3"), noParams);
    expect(await res.json()).toEqual({ page: 3 });
  });

  it("RBAC avant validation body", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    const spy = vi.fn();
    const h = route(
      {
        permission: { resource: "band", action: "delete" },
        body: z.object({ x: z.string() }),
      },
      async () => {
        spy();
        return new Response("ok");
      },
    );
    const res = await h(mkReq("http://localhost/api/test", "POST"), noParams);
    expect(res.status).toBe(403);
    expect(spy).not.toHaveBeenCalled();
  });
});
