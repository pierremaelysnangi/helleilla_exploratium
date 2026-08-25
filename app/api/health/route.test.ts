/**
 * Tests unitaires de GET /api/health.
 * Les trois dépendances (PostgreSQL, Redis, Meilisearch) sont mockées :
 * on vérifie l'agrégation 200/503 et la gestion des timeouts/pannes.
 * NB : pas d'import de route-helpers ici — il enregistre son propre mock
 * de @/lib/redis qui écraserait le nôtre.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Probes pilotables par test (résolution ou rejet).
const probes = vi.hoisted(() => ({
  postgres: vi.fn(),
  redis: vi.fn(),
  meili: vi.fn(),
}));

// Rate limit neutralisé sans importOriginal (le vrai module instancierait
// une connexion ioredis réelle et court-circuiterait notre mock Redis).
vi.mock("@/lib/api/rate-limit", () => ({
  rateLimit: vi.fn(async () => null),
  clientIp: vi.fn(() => "test"),
}));
vi.mock("@/db", () => ({ db: { execute: probes.postgres } }));
vi.mock("@/lib/redis", () => ({ redis: { ping: probes.redis } }));
vi.mock("@/lib/search/meilisearch", () => ({
  meilisearch: { health: probes.meili },
}));

// Import dynamique après les mocks.
const { GET } = await import("./route");

/** Requête minimale pour le wrapper route(). */
function mkHealthReq() {
  return new NextRequest("http://localhost/api/health");
}

/** Toutes les dépendances répondent. */
function allUp() {
  probes.postgres.mockResolvedValue([]);
  probes.redis.mockResolvedValue("PONG");
  probes.meili.mockResolvedValue({ status: "available" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("200 healthy quand toutes les dépendances répondent", async () => {
    allUp();
    const res = await GET(mkHealthReq(), { params: Promise.resolve({}) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("healthy");
    for (const dep of Object.values(json.data.dependencies) as {
      status: string;
      latencyMs?: number;
    }[]) {
      expect(dep.status).toBe("up");
      expect(dep.latencyMs).toBeTypeOf("number");
    }
  });

  it("503 degraded si une dépendance est en panne", async () => {
    allUp();
    probes.redis.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await GET(mkHealthReq(), { params: Promise.resolve({}) });
    expect(res.status).toBe(503);
    expect((await res.json()).data.status).toBe("degraded");
  });

  it("503 si une dépendance dépasse le timeout", async () => {
    allUp();
    // Ne résout jamais : le probe doit trancher au timeout (2 s)
    probes.meili.mockReturnValue(new Promise(() => undefined));
    const res = await GET(mkHealthReq(), { params: Promise.resolve({}) });
    expect(res.status).toBe(503);
  });
});
