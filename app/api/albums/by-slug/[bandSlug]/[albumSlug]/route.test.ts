/**
 * Tests unitaires de GET /api/albums/by-slug/[bandSlug]/[albumSlug].
 *
 * Point central : l'adressage à deux segments. Le slug d'album n'étant
 * unique que dans son groupe, la résolution passe d'abord par le groupe —
 * un album homonyme d'un autre groupe ne doit jamais être renvoyé.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkReq, ctx } from "@/lib/api/__tests__/route-helpers";

vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));

// Espions sur les deux lectures relationnelles (groupe puis album)
const bandFindFirst = vi.hoisted(() => vi.fn());
const albumFindFirst = vi.hoisted(() => vi.fn());
vi.mock("@/db", () => ({
  db: {
    query: {
      bands: { findFirst: bandFindFirst },
      albums: { findFirst: albumFindFirst },
    },
  },
}));

// Import dynamique après les mocks.
const { GET } = await import("./route");

const BAND = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Darkthrone",
  slug: "darkthrone",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/albums/by-slug/[bandSlug]/[albumSlug]", () => {
  it("200 avec le groupe projeté et la tracklist", async () => {
    bandFindFirst.mockResolvedValue(BAND);
    albumFindFirst.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000002",
      bandId: BAND.id,
      title: "A Blaze in the Northern Sky",
      slug: "a-blaze-in-the-northern-sky",
      tracks: [
        {
          id: "t1",
          title: "Kathaarian Life Code",
          discNumber: 1,
          trackNumber: 1,
        },
      ],
    });

    const res = await GET(
      mkReq(),
      ctx({ bandSlug: "darkthrone", albumSlug: "a-blaze-in-the-northern-sky" }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.slug).toBe("a-blaze-in-the-northern-sky");
    // Projection publique du groupe : uniquement id/name/slug
    expect(json.data.band).toEqual(BAND);
    expect(json.data.tracks).toHaveLength(1);
  });

  it("ordonne la tracklist par disque puis par numéro de piste", async () => {
    bandFindFirst.mockResolvedValue(BAND);
    albumFindFirst.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000002",
      bandId: BAND.id,
      title: "Double album",
      slug: "double-album",
      // Volontairement désordonné : la lecture relationnelle ne trie pas
      tracks: [
        { id: "d2t1", discNumber: 2, trackNumber: 1 },
        { id: "d1t2", discNumber: 1, trackNumber: 2 },
        { id: "d1t1", discNumber: 1, trackNumber: 1 },
      ],
    });

    const res = await GET(
      mkReq(),
      ctx({ bandSlug: "darkthrone", albumSlug: "double-album" }),
    );

    const json = await res.json();
    expect(json.data.tracks.map((t: { id: string }) => t.id)).toEqual([
      "d1t1",
      "d1t2",
      "d2t1",
    ]);
  });

  it("404 si le groupe n'existe pas, sans chercher l'album", async () => {
    bandFindFirst.mockResolvedValue(undefined);

    const res = await GET(
      mkReq(),
      ctx({ bandSlug: "inconnu", albumSlug: "peu-importe" }),
    );

    expect(res.status).toBe(404);
    expect(albumFindFirst).not.toHaveBeenCalled();
  });

  it("404 si le groupe existe mais pas l'album", async () => {
    bandFindFirst.mockResolvedValue(BAND);
    albumFindFirst.mockResolvedValue(undefined);

    const res = await GET(
      mkReq(),
      ctx({ bandSlug: "darkthrone", albumSlug: "inconnu" }),
    );

    expect(res.status).toBe(404);
  });

  it("borne la recherche d'album au groupe résolu", async () => {
    bandFindFirst.mockResolvedValue(BAND);
    albumFindFirst.mockResolvedValue({
      id: "a1",
      bandId: BAND.id,
      slug: "live",
      tracks: [],
    });

    await GET(mkReq(), ctx({ bandSlug: "darkthrone", albumSlug: "live" }));

    // Sans ce filtre par bandId, un album « live » d'un autre groupe
    // pourrait être renvoyé (le slug n'est unique que par groupe).
    expect(albumFindFirst).toHaveBeenCalledTimes(1);
    expect(albumFindFirst.mock.calls[0]?.[0]).toHaveProperty("where");
  });

  it("422 si un des deux slugs est vide", async () => {
    const res = await GET(mkReq(), ctx({ bandSlug: "", albumSlug: "x" }));
    expect(res.status).toBe(422);
    expect(bandFindFirst).not.toHaveBeenCalled();
  });
});
