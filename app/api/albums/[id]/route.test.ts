/**
 * Tests unitaires de la route /api/albums/[id] (GET, PATCH, DELETE).
 * Stratégie : toutes les dépendances externes (Redis, auth, DB, files BullMQ,
 * requêtes utilitaires) sont mockées afin de tester uniquement la logique
 * de la route (codes HTTP, permissions, effets sur les files d'indexation).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
// Helpers de test partagés : session simulée (`mockSession`, `setUser`),
// fabrication de requêtes (`mkReq`), contexte de route (`ctx`) et
// chaînage des mocks Drizzle (`chain`, simulant .from().where().limit()).
import {
  mockSession,
  setUser,
  mkReq,
  ctx,
  chain,
} from "@/lib/api/__tests__/route-helpers";

// Mock de Redis : le rate limiter incrémentera toujours un compteur à 1
// (aucune limite atteinte pendant les tests).
vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));

// Mock de better-auth : `getSession` renvoie la session courante,
// contrôlée par `setUser(...)` dans chaque test.
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

// Mock du client Drizzle : `vi.hoisted` permet de déclarer les mocks
// avant leur utilisation par `vi.mock` (hoisting des imports).
const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/db", () => ({ db: dbMock }));

// Mocks des files BullMQ d'indexation (album + pistes), espionnées
// via `add` pour vérifier l'enchaînement des jobs.
const albumQueue = vi.hoisted(() => ({ add: vi.fn() }));
const trackQueue = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({
  albumIndexQueue: albumQueue,
  trackIndexQueue: trackQueue,
}));

// Mock de la requête utilitaire listant les ids de pistes d'un album
// (utilisée par DELETE pour désindexer la descendance).
const queriesMock = vi.hoisted(() => ({
  listTrackIdsByAlbumId: vi.fn(async () => [] as string[]),
}));
vi.mock("@/db/queries/tracks", () => queriesMock);

// Import dynamique APRÈS la déclaration des mocks, pour que le module
// testé reçoive bien les versions mockées.
const { GET, PATCH, DELETE } = await import("./route");

// Identifiants UUID valides utilisés dans les tests (album + 2 pistes).
const ID = "00000000-0000-4000-8000-0000000000a1";
const T1 = "00000000-0000-4000-8000-0000000000t1".replace(/t/g, "9");
const T2 = "00000000-0000-4000-8000-0000000000t2".replace(/t/g, "9");

// Réinitialisation des mocks et de la session avant chaque test.
beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
  queriesMock.listTrackIdsByAlbumId.mockResolvedValue([]);
});

/**
 * Suite GET : vérifie le code 200 avec les données, le 404 si absent,
 * et le 422 si l'id n'est pas un UUID valide (sans toucher la DB).
 */
describe("GET /api/albums/[id]", () => {
  it("200 si trouvé", async () => {
    dbMock.select.mockReturnValue(
      chain([{ id: ID, title: "Transilvanian Hunger" }]),
    );
    const res = await GET(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.title).toBe("Transilvanian Hunger");
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

/**
 * Suite PATCH : vérifie l'interdiction pour un simple user (403),
 * la mise à jour + réindexation pour un contributor (200),
 * et le 404 si aucune ligne n'a été modifiée (sans job ajouté).
 */
describe("PATCH /api/albums/[id]", () => {
  it("403 pour un user simple", async () => {
    setUser("user");
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { title: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("200 pour un contributor + réindexation", async () => {
    setUser("contributor");
    dbMock.update.mockReturnValue(chain([{ id: ID, title: "X" }]));
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { title: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect(albumQueue.add).toHaveBeenCalledWith("index", {
      albumId: ID,
      action: "index",
    });
  });

  it("404 si aucune ligne mise à jour", async () => {
    setUser("contributor");
    dbMock.update.mockReturnValue(chain([]));
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { title: "X" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(404);
    expect(albumQueue.add).not.toHaveBeenCalled();
  });
});

/**
 * Suite DELETE : vérifie l'interdiction pour un contributor (403),
 * la suppression + cascade des jobs de désindexation pour un moderator
 * (1 job album + 2 jobs pistes), et le 404 si absent.
 */
describe("DELETE /api/albums/[id]", () => {
  it("403 pour un contributor", async () => {
    setUser("contributor");
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
    expect(dbMock.delete).not.toHaveBeenCalled();
    expect(queriesMock.listTrackIdsByAlbumId).not.toHaveBeenCalled();
  });

  it("200 pour un moderator + cascade des jobs tracks", async () => {
    setUser("moderator");
    queriesMock.listTrackIdsByAlbumId.mockResolvedValue([T1, T2]);
    dbMock.delete.mockReturnValue(chain([{ id: ID }]));
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ deleted: true });
    expect(albumQueue.add).toHaveBeenCalledWith("delete", {
      albumId: ID,
      action: "delete",
    });
    expect(trackQueue.add).toHaveBeenCalledTimes(2);
    expect(trackQueue.add).toHaveBeenCalledWith("delete", {
      trackId: T1,
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
    expect(albumQueue.add).not.toHaveBeenCalled();
  });
});
