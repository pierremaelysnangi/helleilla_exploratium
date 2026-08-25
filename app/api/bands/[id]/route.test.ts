/**
 * Tests unitaires de la route /api/bands/[id] (GET, PATCH, DELETE).
 * Toutes les dépendances externes (Redis, auth, DB, file BullMQ) sont mockées
 * pour tester la logique de la route : codes HTTP, permissions, jobs d'indexation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
// Helpers partagés : session simulée (`mockSession`, `setUser`),
// fabrication de requêtes (`mkReq`), contexte de route (`ctx`) et
// chaînage des mocks Drizzle (`chain`).
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
// `query.bands.findFirst` sert au GET détail (lecture relationnelle avec genres).
const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: { bands: { findFirst: vi.fn() } },
}));
vi.mock("@/db", () => ({ db: dbMock }));

// Mock espion de la file d'indexation des groupes.
const queueMock = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({
  bandIndexQueue: queueMock,
  embeddingsQueue: { add: vi.fn(async () => undefined) },
}));

// Import dynamique après les mocks afin que la route les utilise.
const { GET, PATCH, DELETE } = await import("./route");

// UUID valide utilisé comme identifiant de groupe dans les tests.
const ID = "00000000-0000-4000-8000-000000000001";

// Réinitialisation des mocks et de la session avant chaque test.
beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

/**
 * Suite GET : vérifie le 200 avec les données du groupe ET ses genres
 * projetés (lecture relationnelle), le 404 si absent, et le 422 si
 * l'id n'est pas un UUID (sans requête SQL exécutée).
 */
describe("GET /api/bands/[id]", () => {
  it("200 si trouvé, avec genres projetés", async () => {
    dbMock.query.bands.findFirst.mockResolvedValue({
      id: ID,
      name: "Darkthrone",
      bandGenres: [
        { genre: { id: "g1", name: "Black Metal", slug: "black-metal" } },
        { genre: { id: "g2", name: "Doom", slug: "doom" } },
      ],
    });
    const res = await GET(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe("Darkthrone");
    // La jonction est absente ; seuls id/name/slug des genres sont exposés
    expect(json.data.genres).toEqual([
      { id: "g1", name: "Black Metal", slug: "black-metal" },
      { id: "g2", name: "Doom", slug: "doom" },
    ]);
  });

  it("404 si absent", async () => {
    dbMock.query.bands.findFirst.mockResolvedValue(undefined);
    const res = await GET(mkReq(), ctx({ id: ID }));
    expect(res.status).toBe(404);
  });

  it("422 si id non-uuid", async () => {
    const res = await GET(mkReq(), ctx({ id: "pas-un-uuid" }));
    expect(res.status).toBe(422);
    expect(dbMock.query.bands.findFirst).not.toHaveBeenCalled();
  });
});

/**
 * Suite PATCH : vérifie l'interdiction pour un simple user (403),
 * la mise à jour + réindexation pour un contributor (200),
 * et le 404 si aucune ligne n'a été modifiée (sans job ajouté).
 */
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

/**
 * Suite DELETE : vérifie l'interdiction pour un contributor (403),
 * la suppression + job de désindexation pour un moderator (200),
 * et le 404 si le groupe est absent.
 */
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
