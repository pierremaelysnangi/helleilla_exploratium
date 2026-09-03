/**
 * Tests du fabrique de route handlers (lib/api/handler.ts).
 * Vérifie les codes HTTP du pipeline : 401 sans session, 403 sans
 * permission, 422 sur body invalide, coercion de la query zod et
 * exécution du RBAC AVANT la validation du corps.
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach } from "vitest";
// Schémas zod pour tester la validation des entrées
import { z } from "zod";
// Fabrique sous test
import { route } from "./handler";
// Requête Next.js utilisée pour simuler les appels HTTP
import { NextRequest } from "next/server";

// Espion de getSession, branché dans le mock de @/lib/auth ci-dessous
const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: () => mockGetSession() } },
}));
// Mocks des modules Next.js et du rate limiting (no-op)
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("./rate-limit", () => ({
  rateLimit: async () => null,
  clientIp: () => "127.0.0.1",
}));

/**
 * Fabrique une NextRequest de test.
 *
 * @param url - URL complète de la requête (query string incluse).
 * @param method - Méthode HTTP.
 * @param body - Corps JSON optionnel (sérialisé automatiquement).
 */
const mkReq = (
  url = "http://localhost/api/test",
  method = "GET",
  body?: unknown,
) =>
  new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

// Segment de route sans paramètres dynamiques
const noParams = { params: Promise.resolve({}) };

// Suite principale : comportement du pipeline du handler
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
