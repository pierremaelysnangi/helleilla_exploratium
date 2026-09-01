/**
 * Tests unitaires de GET /api/genres/by-slug/[slug].
 * Lecture publique : genre + parent + sous-genres + groupes rattachés,
 * 404 si slug inconnu, 422 si slug vide.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkReq, ctx, chain } from "@/lib/api/__tests__/route-helpers";

vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));

// Espions : lecture relationnelle du genre + select() des sous-genres
const genreFindFirst = vi.hoisted(() => vi.fn());
const select = vi.hoisted(() => vi.fn());
vi.mock("@/db", () => ({
  db: {
    query: { genres: { findFirst: genreFindFirst } },
    select,
  },
}));

// Import dynamique après les mocks.
const { GET } = await import("./route");

const GENRE = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Black Metal",
  slug: "black-metal",
  parentId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  select.mockReturnValue(chain([]));
});

describe("GET /api/genres/by-slug/[slug]", () => {
  it("200 avec les groupes rattachés triés par nom", async () => {
    genreFindFirst.mockResolvedValue({
      ...GENRE,
      bandGenres: [
        { band: { id: "b2", name: "Mayhem", slug: "mayhem" } },
        { band: { id: "b1", name: "Darkthrone", slug: "darkthrone" } },
      ],
    });

    const res = await GET(mkReq(), ctx({ slug: "black-metal" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.slug).toBe("black-metal");
    // Tri alphabétique pour un rendu stable d'un déploiement à l'autre
    expect(json.data.bands.map((b: { name: string }) => b.name)).toEqual([
      "Darkthrone",
      "Mayhem",
    ]);
    // La table de jonction n'est jamais exposée telle quelle
    expect(json.data.bandGenres).toBeUndefined();
  });

  it("expose le parent quand le genre en a un", async () => {
    genreFindFirst
      .mockResolvedValueOnce({
        ...GENRE,
        name: "Symphonic Black Metal",
        slug: "symphonic-black-metal",
        parentId: "parent-id",
        bandGenres: [],
      })
      .mockResolvedValueOnce({
        id: "parent-id",
        name: "Black Metal",
        slug: "black-metal",
      });

    const res = await GET(mkReq(), ctx({ slug: "symphonic-black-metal" }));

    const json = await res.json();
    expect(json.data.parent).toEqual({
      id: "parent-id",
      name: "Black Metal",
      slug: "black-metal",
    });
  });

  it("renvoie parent null pour un genre racine", async () => {
    genreFindFirst.mockResolvedValue({ ...GENRE, bandGenres: [] });

    const res = await GET(mkReq(), ctx({ slug: "black-metal" }));

    const json = await res.json();
    expect(json.data.parent).toBeNull();
  });

  it("projette les sous-genres en résumé { id, name, slug }", async () => {
    genreFindFirst.mockResolvedValue({ ...GENRE, bandGenres: [] });
    select.mockReturnValue(
      chain([
        {
          id: "sub1",
          name: "Depressive Black Metal",
          slug: "depressive-black-metal",
          parentId: GENRE.id,
          createdAt: "2020-01-01",
        },
      ]),
    );

    const res = await GET(mkReq(), ctx({ slug: "black-metal" }));

    const json = await res.json();
    expect(json.data.subgenres).toEqual([
      {
        id: "sub1",
        name: "Depressive Black Metal",
        slug: "depressive-black-metal",
      },
    ]);
  });

  it("404 si aucun genre ne porte ce slug", async () => {
    genreFindFirst.mockResolvedValue(undefined);
    const res = await GET(mkReq(), ctx({ slug: "inconnu" }));
    expect(res.status).toBe(404);
  });

  it("422 si le slug est vide", async () => {
    const res = await GET(mkReq(), ctx({ slug: "" }));
    expect(res.status).toBe(422);
    expect(genreFindFirst).not.toHaveBeenCalled();
  });
});
