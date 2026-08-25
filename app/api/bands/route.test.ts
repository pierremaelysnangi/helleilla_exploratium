/**
 * Tests unitaires de la route /api/bands (GET liste paginée, POST création).
 * Toutes les dépendances externes (Redis, auth, DB, file BullMQ) sont mockées
 * pour tester les codes HTTP, la validation et l'indexation.
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
const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("@/db", () => ({ db: dbMock }));

// Mock espion de la file d'indexation des groupes.
const queueMock = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({
  bandIndexQueue: queueMock,
  embeddingsQueue: { add: vi.fn(async () => undefined) },
}));

// Import dynamique après les mocks afin que la route les utilise.
const { GET, POST } = await import("./route");

// Réinitialisation des mocks et de la session avant chaque test.
beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

/**
 * Suite GET : vérifie la réponse 200 paginée (items + meta complètes),
 * et les 422 de validation des query params (`perPage` hors bornes,
 * `sort` inconnu).
 */
describe("GET /api/bands", () => {
  it("renvoie une liste paginée", async () => {
    const rows = [{ id: "b1", name: "Emperor" }];
    dbMock.select
      .mockReturnValueOnce(chain(rows))
      .mockReturnValueOnce(chain([{ count: 1 }]));

    const res = await GET(
      mkReq("http://localhost/api/bands?page=1&perPage=20"),
      ctx(),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(rows);
    expect(json.meta).toEqual({
      total: 1,
      page: 1,
      perPage: 20,
      totalPages: 1,
    });
  });

  it("422 si perPage hors bornes", async () => {
    const res = await GET(
      mkReq("http://localhost/api/bands?perPage=9999"),
      ctx(),
    );
    expect(res.status).toBe(422);
  });

  it("422 si sort inconnu", async () => {
    const res = await GET(
      mkReq("http://localhost/api/bands?sort=bogus"),
      ctx(),
    );
    expect(res.status).toBe(422);
  });
});

/**
 * Suite POST : vérifie 401 sans session, 403 pour un simple user,
 * 201 + job d'indexation pour un contributor, et le 422 si le corps
 * est invalide (sans insertion en DB).
 */
describe("POST /api/bands", () => {
  const valid = { name: "Mayhem", slug: "mayhem" };

  it("401 sans session", async () => {
    const res = await POST(
      mkReq("http://localhost/api/bands", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(401);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("403 pour un user simple", async () => {
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/api/bands", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(403);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("201 pour un contributor", async () => {
    setUser("contributor");
    dbMock.insert.mockReturnValue(chain([{ id: "b1", ...valid }]));

    const res = await POST(
      mkReq("http://localhost/api/bands", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).data.id).toBe("b1");
    expect(queueMock.add).toHaveBeenCalledWith("index", {
      bandId: "b1",
      action: "index",
    });
  });

  it("422 body invalide, sans toucher la DB", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/bands", "POST", { name: "" }),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });
});
