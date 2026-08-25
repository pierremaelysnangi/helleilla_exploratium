/**
 * Tests unitaires de la route /api/genres (POST uniquement ici).
 * Focus : le RBAC durci — seuls les moderators peuvent créer un genre.
 * Redis, auth et DB sont mockés pour isoler la logique de la route.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
// Helpers partagés : session simulée, fabrication de requêtes,
// contexte de route et chaînage des mocks Drizzle.
import {
  mockSession,
  setUser,
  mkReq,
  ctx,
  chain,
} from "@/lib/api/__tests__/route-helpers";

// Mock de Redis : le rate limiter ne bloque jamais (compteur toujours à 1).
vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));

// Mock de better-auth : session pilotée par `setUser(...)` dans chaque test.
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

// Mock du client Drizzle (déclaré via `vi.hoisted` pour précéder le hoisting).
const dbMock = vi.hoisted(() => ({ select: vi.fn(), insert: vi.fn() }));
vi.mock("@/db", () => ({ db: dbMock }));

// Import dynamique après les mocks afin que la route les utilise.
const { POST } = await import("./route");

// Réinitialisation des mocks et de la session avant chaque test.
beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

/**
 * Suite POST — RBAC durci : vérifie qu'un contributor est refusé (403,
 * sans insertion en DB) tandis qu'un moderator obtient une création
 * réussie (201).
 */
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
