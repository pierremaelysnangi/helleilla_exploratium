/**
 * Tests des routes /api/forum (GET fil paginé, POST publication).
 *
 * L'enjeu de la suite POST est la MATRICE : donner son avis ne demande
 * pas le rôle contributeur, contrairement à toute autre écriture de
 * l'application. Un test le fixe explicitement, faute de quoi un
 * durcissement de la matrice viderait la page sans que rien n'échoue.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockSession,
  setUser,
  mkReq,
  ctx,
} from "@/lib/api/__tests__/route-helpers";

vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

// Les lectures et écritures passent par les modules de requêtes : les
// mocker ici garde le test centré sur le contrat HTTP.
const queries = vi.hoisted(() => ({
  listForumPosts: vi.fn(async () => ({ posts: [], total: 0 })),
}));
vi.mock("@/db/queries/forum", () => queries);

const mutations = vi.hoisted(() => ({
  createForumPost: vi.fn(async () => ({ id: "p1" })),
}));
vi.mock("@/db/mutations/forum", () => mutations);

const bands = vi.hoisted(() => ({
  getBandById: vi.fn(async () => ({ id: "b1" }) as unknown),
}));
vi.mock("@/db/queries/bands", () => bands);

const albums = vi.hoisted(() => ({
  getAlbumById: vi.fn(async () => ({ id: "a1" }) as unknown),
}));
vi.mock("@/db/queries/albums", () => albums);

const { GET, POST } = await import("./route");

const BAND = "550e8400-e29b-41d4-a716-446655440000";
const BODY = "Un disque qui n'a pas pris une ride.";

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
  queries.listForumPosts.mockResolvedValue({ posts: [], total: 0 });
  bands.getBandById.mockResolvedValue({ id: "b1" });
  albums.getAlbumById.mockResolvedValue({ id: "a1" });
});

describe("GET /api/forum", () => {
  it("renvoie le fil général sans authentification", async () => {
    const res = await GET(mkReq("http://localhost/api/forum"), ctx());
    expect(res.status).toBe(200);
    expect(queries.listForumPosts).toHaveBeenCalledWith({}, 1, 20);
  });

  it("transmet le filtre de sujet", async () => {
    await GET(mkReq(`http://localhost/api/forum?bandId=${BAND}`), ctx());
    expect(queries.listForumPosts).toHaveBeenCalledWith(
      { bandId: BAND, albumId: undefined },
      1,
      20,
    );
  });

  it("422 si le sujet n'est pas un UUID", async () => {
    const res = await GET(
      mkReq("http://localhost/api/forum?bandId=emperor"),
      ctx(),
    );
    expect(res.status).toBe(422);
  });
});

describe("POST /api/forum", () => {
  const valid = { bandId: BAND, body: BODY };

  it("401 sans session", async () => {
    const res = await POST(
      mkReq("http://localhost/api/forum", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(401);
    expect(mutations.createForumPost).not.toHaveBeenCalled();
  });

  it("201 pour un simple utilisateur connecté", async () => {
    // Volontaire : un avis est une opinion, pas une fiche
    // encyclopédique. Exiger le rôle contributeur viderait le forum.
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/api/forum", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(201);
    expect(mutations.createForumPost).toHaveBeenCalledWith({
      userId: "u1",
      bandId: BAND,
      albumId: undefined,
      body: BODY,
    });
  });

  it("404 si le groupe visé n'existe pas", async () => {
    setUser("user");
    bands.getBandById.mockResolvedValue(null);
    const res = await POST(
      mkReq("http://localhost/api/forum", "POST", valid),
      ctx(),
    );
    expect(res.status).toBe(404);
    expect(mutations.createForumPost).not.toHaveBeenCalled();
  });

  it("422 sans sujet", async () => {
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/api/forum", "POST", { body: BODY }),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(mutations.createForumPost).not.toHaveBeenCalled();
  });

  it("422 si le texte est trop court", async () => {
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/api/forum", "POST", {
        bandId: BAND,
        body: "bof",
      }),
      ctx(),
    );
    expect(res.status).toBe(422);
  });
});
