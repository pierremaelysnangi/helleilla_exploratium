/**
 * Tests unitaires de la route /api/albums (GET liste paginée, POST création).
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

// Mock de better-auth : la session est pilotée par `setUser(...)` par test.
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

// Mock du client Drizzle (`vi.hoisted` pour précéder le hoisting de `vi.mock`).
const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("@/db", () => ({ db: dbMock }));

// Mock espion de la file d'indexation des albums.
const queueMock = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({ albumIndexQueue: queueMock }));

// Import dynamique après les mocks afin que la route les utilise.
const { GET, POST } = await import("./route");

// Identifiants UUID valides pour les fixtures de test.
const BAND_ID = "00000000-0000-4000-8000-0000000000b1";
const ALBUM_ID = "00000000-0000-4000-8000-0000000000a1";

// Corps de requête POST valide servant de base aux tests de validation.
const validAlbum = {
  bandId: BAND_ID,
  title: "Transilvanian Hunger",
  slug: "transilvanian-hunger",
  type: "album",
  releaseYear: 1994,
};

// Réinitialisation des mocks et de la session avant chaque test.
beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

/**
 * Suite GET : vérifie la réponse 200 avec pagination (items + meta.total),
 * et le 422 si `perPage` dépasse la borne autorisée (sans requête DB).
 */
describe("GET /api/albums", () => {
  it("200 + pagination", async () => {
    dbMock.select
      .mockReturnValueOnce(
        chain([
          {
            id: ALBUM_ID,
            title: "Transilvanian Hunger",
            band: { id: BAND_ID, name: "Darkthrone", slug: "darkthrone" },
          },
        ]),
      )
      .mockReturnValueOnce(chain([{ count: 1 }]));
    const res = await GET(mkReq("http://localhost/api/albums"), ctx());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
    // Le groupe est joint à la ligne : sans lui, l'URL canonique d'un
    // album (band-scopée) n'est pas constructible côté client.
    expect(json.data[0].band.slug).toBe("darkthrone");
  });

  it("422 si perPage invalide", async () => {
    const res = await GET(
      mkReq("http://localhost/api/albums?perPage=9999"),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(dbMock.select).not.toHaveBeenCalled();
  });
});

/**
 * Suite POST : vérifie 401 sans session, 403 pour un simple user,
 * 201 + job d'indexation pour un contributor, et les 422 de validation
 * (bandId non-uuid, slug non kebab-case) sans insertion en DB.
 */
describe("POST /api/albums", () => {
  it("401 si non authentifié", async () => {
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", validAlbum),
      ctx(),
    );
    expect(res.status).toBe(401);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("403 pour un user simple", async () => {
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", validAlbum),
      ctx(),
    );
    expect(res.status).toBe(403);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("201 pour un contributor + indexation", async () => {
    setUser("contributor");
    dbMock.insert.mockReturnValue(chain([{ id: ALBUM_ID, ...validAlbum }]));
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", validAlbum),
      ctx(),
    );
    expect(res.status).toBe(201);
    expect(queueMock.add).toHaveBeenCalledWith("index", {
      albumId: ALBUM_ID,
      action: "index",
    });
  });

  it("422 si bandId non-uuid", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", {
        ...validAlbum,
        bandId: "nope",
      }),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("422 si slug pas en kebab-case", async () => {
    setUser("contributor");
    const res = await POST(
      mkReq("http://localhost/api/albums", "POST", {
        ...validAlbum,
        slug: "Pas Kebab",
      }),
      ctx(),
    );
    expect(res.status).toBe(422);
  });
});
