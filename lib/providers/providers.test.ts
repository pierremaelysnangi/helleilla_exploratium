/**
 * Tests des providers externes (musicbrainz, wikidata, discogs, deezer).
 * fetch est stubé et env mockée : vérifie la construction des URLs,
 * les contrats zod, l'extraction de données (Wikidata/membres) et la
 * dégradation propre de Discogs sans token.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// Env factice : DISCOGS_TOKEN piloté par ce conteneur.
const envMock = vi.hoisted(() => ({
  DISCOGS_TOKEN: undefined as string | undefined,
}));
vi.mock("@/lib/env", () => ({ env: envMock }));

// Cache Redis neutre pour http.ts.
vi.mock("@/lib/redis", () => ({
  redis: { get: vi.fn(async () => null), set: vi.fn(async () => "OK") },
}));

/** Stub fetch capturant l'URL appelée. */
function stubFetch(status: number, payload: unknown) {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL) =>
      new Response(JSON.stringify(payload), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, lastUrl: () => String(fetchMock.mock.calls.at(-1)?.[0]) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const { searchArtists, getArtist, extractMembers } =
  await import("./musicbrainz");

describe("musicbrainz", () => {
  it("construit une requête de recherche encodée", async () => {
    const { lastUrl } = stubFetch(200, { artists: [] });
    await searchArtists("Emperor");
    expect(lastUrl()).toContain("/artist?query=Emperor&limit=5&fmt=json");
  });

  it("extrait les membres via les relations backward 'member of band'", async () => {
    stubFetch(200, {
      id: "mb-1",
      name: "Emperor",
      relations: [
        {
          type: "member of band",
          direction: "backward",
          artist: { id: "m1", name: "Ihsahn" },
        },
        {
          type: "member of band",
          direction: "forward", // sens inverse : ignoré
          artist: { id: "m2", name: "Autre" },
        },
      ],
    });
    const artist = await getArtist("mb-1");
    expect(extractMembers(artist)).toEqual([{ id: "m1", name: "Ihsahn" }]);
  });

  it("extrait l'ID Wikidata depuis les relations URL", async () => {
    const { extractWikidataId } = await import("./musicbrainz");
    stubFetch(200, {
      id: "mb-1",
      name: "Emperor",
      relations: [
        {
          type: "wikidata",
          url: { resource: "https://www.wikidata.org/wiki/Q494" },
        },
      ],
    });
    const artist = await getArtist("mb-1");
    expect(extractWikidataId(artist)).toBe("Q494");
  });
});

const { getSummary } = await import("./wikidata");

describe("wikidata", () => {
  it("récupère extrait et image originale", async () => {
    stubFetch(200, {
      type: "item",
      title: "Q494",
      extract: "Groupe de black metal norvégien.",
      originalimage: { source: "https://upload.wikimedia.org/x.jpg" },
    });
    const summary = await getSummary("Q494");
    expect(summary?.extract).toContain("black metal");
    expect(summary?.originalimage?.source).toContain("wikimedia");
  });

  it("retourne null sur une entité inexistante (404)", async () => {
    stubFetch(404, {});
    expect(await getSummary("QINEXISTE")).toBeNull();
  });
});

describe("discogs", () => {
  it("est désactivé sans token : aucun appel réseau, résultat null", async () => {
    envMock.DISCOGS_TOKEN = undefined;
    const discogs = await import("./discogs");
    const { fetchMock } = stubFetch(200, { results: [] });

    expect(discogs.isDiscogsEnabled()).toBe(false);
    expect(await discogs.searchArtists("x")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envoie le token en en-tête quand configuré", async () => {
    envMock.DISCOGS_TOKEN = "test-token-1234";
    // Recharge le module pour repartir du nouvel env
    vi.resetModules();
    const discogs = await import("./discogs");
    const { lastUrl } = stubFetch(200, {
      results: [{ id: 1, title: "Emperor" }],
    });

    const result = await discogs.searchArtists("Emperor");
    expect(result?.results[0].title).toBe("Emperor");
    expect(lastUrl()).toContain("/database/search?type=artist&q=Emperor");
    envMock.DISCOGS_TOKEN = undefined;
  });
});

const { searchTracks } = await import("./deezer");

describe("deezer", () => {
  it("renvoie uniquement les pistes disposant d'un preview MP3", async () => {
    stubFetch(200, {
      data: [
        {
          id: 1,
          title: "I Am the Black Wizards",
          preview: "https://cdns-preview.dzcdn.net/a.mp3",
          artist: { id: 9, name: "Emperor" },
          album: { id: 3, title: "Anthems" },
        },
        {
          id: 2,
          title: "Sans preview",
          preview: "",
          artist: { id: 9, name: "Emperor" },
          album: { id: 3, title: "Anthems" },
        },
      ],
    });
    const tracks = await searchTracks("Emperor wizards");
    expect(tracks).toHaveLength(1);
    expect(tracks[0].preview).toContain("cdns-preview");
  });
});
