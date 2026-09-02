/**
 * Tests unitaires du resolver média (lib/media/resolver.ts).
 * Providers, DB et Redis mockés : vérifie la fusion multi-sources,
 * l'isolement des pannes (allSettled -> degraded), le cache Redis et
 * l'absence de référence MusicBrainz (résultat minimal + previews).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Cache Redis en mémoire.
const redisStore = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
      return "OK";
    }),
    del: vi.fn(async (k: string) => {
      store.delete(k);
      return 1;
    }),
  };
});
vi.mock("@/lib/redis", () => ({ redis: redisStore }));

// Espions DB.
const dbMock = vi.hoisted(() => ({
  getBandById: vi.fn(),
  getExternalRefs: vi.fn(),
}));
vi.mock("@/db/queries/bands", () => ({ getBandById: dbMock.getBandById }));
vi.mock("@/db/queries/externalRefs", () => ({
  getExternalRefs: dbMock.getExternalRefs,
}));

// Providers factices pilotables par test.
const providersMock = vi.hoisted(() => ({
  wdImage: vi.fn(),
  mbGetArtist: vi.fn(),
  mbSearch: vi.fn(),
  wdSummary: vi.fn(),
  discogsEnabled: true,
  discogsGetArtist: vi.fn(),
  discogsSearch: vi.fn(),
  deezerSearch: vi.fn(),
}));
vi.mock("@/lib/providers", () => ({
  dataProviders: {
    musicbrainz: {
      getArtist: providersMock.mbGetArtist,
      searchArtists: providersMock.mbSearch,
    },
    wikidata: {
      getSummary: providersMock.wdSummary,
      getEntityImageUrl: providersMock.wdImage,
    },
    discogs: {
      getArtist: providersMock.discogsGetArtist,
      searchArtists: providersMock.discogsSearch,
      isDiscogsEnabled: () => providersMock.discogsEnabled,
    },
    deezer: { searchTracks: providersMock.deezerSearch },
  },
  isProviderAvailable: (name: string) =>
    name === "discogs" ? providersMock.discogsEnabled : true,
}));

const { resolveBandMedia } = await import("./resolver");

/** Bande minimale en base. */
function stubBand() {
  dbMock.getBandById.mockResolvedValue({
    id: "b1",
    name: "Emperor",
    slug: "emperor",
    countryCode: "NO",
    formedYear: 1991,
    dissolvedYear: 2001,
    bio: null,
    imageUrl: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  redisStore.store.clear();
  stubBand();
});

describe("resolveBandMedia", () => {
  it("404 métier si le groupe n'existe pas", async () => {
    dbMock.getBandById.mockResolvedValue(null);
    await expect(resolveBandMedia("b1")).rejects.toThrow(/introuvable/);
  });

  it("fusionne MusicBrainz + Wikidata + Deezer quand la ref MB existe", async () => {
    dbMock.getExternalRefs.mockResolvedValue([
      { provider: "musicbrainz", externalId: "mb-1" },
    ]);
    providersMock.mbGetArtist.mockResolvedValue({
      id: "mb-1",
      name: "Emperor",
      country: "NO",
      area: { name: "Norway" },
      "life-span": { begin: "1991", end: "2001", ended: true },
      // Doublon volontaire de casse : le resolver doit dédoublonner
      genres: [{ name: "black metal" }, { name: "Black Metal" }],
      relations: [
        {
          type: "member of band",
          direction: "backward",
          artist: { id: "m1", name: "Ihsahn" },
          begin: "1991",
          attributes: ["vocal", "keyboard"],
        },
        {
          type: "member of band",
          direction: "backward",
          artist: { id: "m2", name: "Samoth" },
          begin: "1991",
          end: "2001",
          ended: true,
        },
        {
          type: "official homepage",
          url: { resource: "https://emperor.test/?utm_source=mb" },
        },
        {
          type: "wikidata",
          url: { resource: "https://www.wikidata.org/wiki/Q494" },
        },
      ],
    });
    providersMock.wdSummary.mockResolvedValue({
      type: "item",
      title: "Q494",
      extract: "Groupe norvégien.",
    });
    // L'image vient de la déclaration P18 de l'entité, pas du résumé :
    // celui-ci décrit la page Wikidata et n'en porte jamais.
    providersMock.wdImage.mockResolvedValue(
      "https://commons.wikimedia.org/wiki/Special:FilePath/e.jpg?width=800",
    );
    providersMock.deezerSearch.mockResolvedValue([
      {
        id: 1,
        title: "I Am the Black Wizards",
        preview: "https://cdn.dz/a.mp3",
        artist: { id: 9, name: "Emperor" },
        album: {
          id: 3,
          title: "Anthems",
          cover_medium: "https://cdn.dz/c.jpg",
        },
      },
    ]);

    const media = await resolveBandMedia("b1");

    expect(media.info.area).toBe("Norway");
    expect(media.info.lifeSpan).toEqual({
      begin: "1991",
      end: "2001",
      ended: true,
    });
    expect(media.info.memberships).toEqual([
      {
        id: "m1",
        name: "Ihsahn",
        ended: false,
        beginYear: 1991,
        endYear: null,
        roles: ["vocal", "keyboard"],
      },
      {
        id: "m2",
        name: "Samoth",
        ended: true,
        beginYear: 1991,
        endYear: 2001,
        roles: [],
      },
    ]);
    // Les variantes de casse de MusicBrainz sont fusionnées
    expect(media.info.genres).toEqual(["black metal"]);
    // Le lien officiel est exposé, débarrassé de son paramètre de campagne
    expect(media.links).toContainEqual({
      provider: "musicbrainz",
      label: "Site officiel",
      url: "https://emperor.test/",
    });
    expect(media.info.wikidata?.extract).toContain("norvégien");
    expect(media.images.some((i) => i.provider === "wikidata")).toBe(true);
    expect(media.images.map((i) => i.provider)).toEqual(["wikidata"]);
    expect(media.previews).toHaveLength(1);
    expect(media.degraded).toBe(false);

    // Le résultat a été mis en cache
    expect(redisStore.store.has("media:band:b1")).toBe(true);
  });

  it("marque degraded si un provider tombe, sans échouer", async () => {
    dbMock.getExternalRefs.mockResolvedValue([
      { provider: "musicbrainz", externalId: "mb-1" },
    ]);
    providersMock.mbGetArtist.mockRejectedValue(new Error("MB down"));
    providersMock.deezerSearch.mockResolvedValue([]);

    const media = await resolveBandMedia("b1");
    expect(media.degraded).toBe(true);
    expect(media.info.memberships).toEqual([]); // partiel mais valide
  });

  it("sans aucune ref : résultat minimal avec previews Deezer seuls", async () => {
    dbMock.getExternalRefs.mockResolvedValue([]);
    providersMock.deezerSearch.mockResolvedValue([]);

    const media = await resolveBandMedia("b1");
    expect(media.info.area).toBeNull();
    expect(media.images).toEqual([]);
    expect(media.degraded).toBe(false);
    // Deezer est interrogé même sans ref (provider public)
    expect(providersMock.deezerSearch).toHaveBeenCalledWith("Emperor");
  });

  it("sert depuis le cache Redis si présent (aucun provider appelé)", async () => {
    const cached = {
      band: { id: "b1", name: "Cached", slug: "cached" },
      info: { memberships: [], genres: [] },
      images: [],
      links: [],
      previews: [],
      degraded: false,
    };
    redisStore.store.set("media:band:b1", JSON.stringify(cached));

    const media = await resolveBandMedia("b1");
    expect(media.band.name).toBe("Cached");
    expect(providersMock.mbGetArtist).not.toHaveBeenCalled();
    expect(providersMock.deezerSearch).not.toHaveBeenCalled();
  });

  it("ignore une entrée de cache au format obsolète et recalcule", async () => {
    // Après une évolution du DTO, les entrées écrites par la version
    // précédente restent 24 h en cache : les servir ferait échouer le
    // parse et remonterait une 500 sur une page publique.
    redisStore.store.set(
      "media:band:b1",
      JSON.stringify({ band: { id: "b1" }, info: {} }),
    );
    dbMock.getExternalRefs.mockResolvedValue([]);
    providersMock.deezerSearch.mockResolvedValue([]);

    const media = await resolveBandMedia("b1");

    expect(media.band.name).toBe("Emperor");
    expect(providersMock.deezerSearch).toHaveBeenCalled();
  });
});

describe("invalidateBandMedia", () => {
  it("purge la clé de cache du groupe", async () => {
    redisStore.store.set("media:band:b1", "{}");
    const { invalidateBandMedia } = await import("./resolver");
    await invalidateBandMedia("b1");
    expect(redisStore.store.has("media:band:b1")).toBe(false);
  });
});
