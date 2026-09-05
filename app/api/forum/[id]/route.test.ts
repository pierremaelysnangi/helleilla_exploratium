/**
 * Tests de DELETE /api/forum/:id.
 *
 * Le droit de retrait ne se lit pas entièrement dans la matrice RBAC :
 * une matrice décrit des rôles, pas le lien entre une personne et une
 * ligne précise. La règle « son auteur, ou la modération » est donc
 * portée par la route, et c'est elle que ces tests verrouillent.
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

const queries = vi.hoisted(() => ({
  getForumPostAuthor: vi.fn(async () => "u1" as string | null),
}));
vi.mock("@/db/queries/forum", () => queries);

const mutations = vi.hoisted(() => ({
  deleteForumPost: vi.fn(async () => {}),
}));
vi.mock("@/db/mutations/forum", () => mutations);

const { DELETE } = await import("./route");

const ID = "550e8400-e29b-41d4-a716-446655440000";
const url = `http://localhost/api/forum/${ID}`;

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
  queries.getForumPostAuthor.mockResolvedValue("u1");
});

describe("DELETE /api/forum/:id", () => {
  it("401 sans session", async () => {
    const res = await DELETE(mkReq(url, "DELETE"), ctx({ id: ID }));
    expect(res.status).toBe(401);
  });

  it("laisse l'auteur retirer son propre avis", async () => {
    setUser("user", "u1");
    const res = await DELETE(mkReq(url, "DELETE"), ctx({ id: ID }));
    expect(res.status).toBe(200);
    expect(mutations.deleteForumPost).toHaveBeenCalledWith(ID);
  });

  it("403 pour un tiers sans droit de modération", async () => {
    setUser("contributor", "u2");
    const res = await DELETE(mkReq(url, "DELETE"), ctx({ id: ID }));
    expect(res.status).toBe(403);
    expect(mutations.deleteForumPost).not.toHaveBeenCalled();
  });

  it("laisse la modération retirer l'avis d'autrui", async () => {
    setUser("moderator", "u2");
    const res = await DELETE(mkReq(url, "DELETE"), ctx({ id: ID }));
    expect(res.status).toBe(200);
    expect(mutations.deleteForumPost).toHaveBeenCalledWith(ID);
  });

  it("404 si l'avis n'existe pas", async () => {
    setUser("moderator", "u2");
    queries.getForumPostAuthor.mockResolvedValue(null);
    const res = await DELETE(mkReq(url, "DELETE"), ctx({ id: ID }));
    expect(res.status).toBe(404);
    expect(mutations.deleteForumPost).not.toHaveBeenCalled();
  });
});
