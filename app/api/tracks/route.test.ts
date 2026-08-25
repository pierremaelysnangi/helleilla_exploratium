/**
 * Tests unitaires de la route /api/tracks (GET liste paginée, POST création).
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

// Mock espion de la file d'indexation des pistes.
const queueMock = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({ trackIndexQueue: queueMock }));

// Import dynamique après les mocks afin que la route les utilise.
const { GET, POST } = await import("./route");

// Identifiants UUID valides pour les fixtures de test.
const ALBUM_ID = "00000000-0000-4000-8000-0000000000a1";
const TRACK_ID = "00000000-0000-4000-8000-000000000091";

// Corps de requête POST valide servant de base aux tests de validation.
const validTrack = {
  albumId: ALBUM_ID,
  title: "Slottet i det fjerne",
  trackNumber: 1,
};

// Réinitialisation des mocks et de la session avant chaque test.
beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

/**
 * Suite GET : vérifie la réponse 200 avec pagination (items + meta.total),
 * et le 422 si `page` est invalide (0 ou négatif), sans requête DB.
 */
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

/**
 * Suite POST : vérifie 401 sans session, 403 pour un simple user,
 * 201 + job d'indexation pour un contributor, et les 422 de validation
 * (trackNumber négatif, audioUrl mal formée) sans insertion en DB.
 */
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
