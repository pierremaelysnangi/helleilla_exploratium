/**
 * Tests de l'import de discographie (lib/media/discography.ts).
 *
 * Trois invariants gouvernent ce module :
 * - il est ADDITIF : une sortie déjà en base n'est jamais réécrite ;
 * - il RESTREINT le périmètre aux sorties principales, sinon les fiches
 *   se noient dans les singles, compilations et répétitions ;
 * - il produit des slugs UNIQUES par groupe, la contrainte
 *   `albums_band_slug_uq` portant sur `(band_id, slug)`.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("@/db", () => ({ db: dbMock }));

const providerMock = vi.hoisted(() => ({ listReleaseGroups: vi.fn() }));
vi.mock("@/lib/providers/coverart", async (original) => ({
  // Les fonctions pures (albumTypeOf, normalizeTitle) sont conservées :
  // les tester à travers l'import est justement ce qui vérifie que le
  // périmètre s'applique aux vrais types MusicBrainz.
  ...(await original<typeof import("@/lib/providers/coverart")>()),
  listReleaseGroups: providerMock.listReleaseGroups,
}));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/redis", () => ({
  redis: { get: vi.fn(async () => null), set: vi.fn(async () => "OK") },
}));

const { importDiscographyForBand, MAIN_RELEASE_TYPES } =
  await import("./discography");

/** Chaîne de lecture Drizzle réduite à ce que le module appelle. */
function selectChain(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  for (const m of ["from", "where", "limit"]) c[m] = vi.fn(() => c);
  c.then = (resolve: (v: unknown) => void) => resolve(rows);
  return c;
}

/** Capture les insertions : `albums` renvoie un id, `external_refs` non. */
function captureInserts() {
  const albumValues: Record<string, unknown>[] = [];
  const refValues: Record<string, unknown>[] = [];
  let n = 0;

  dbMock.insert.mockImplementation(() => ({
    values: (v: Record<string, unknown>) => {
      if ("entityType" in v) {
        refValues.push(v);
        return { onConflictDoUpdate: vi.fn(async () => undefined) };
      }
      albumValues.push(v);
      n += 1;
      return { returning: vi.fn(async () => [{ id: `nouveau-${n}` }]) };
    },
  }));

  return { albumValues, refValues };
}

/** Release-group minimal. */
function rg(
  title: string,
  primary: string | null,
  secondary: string[] = [],
  date: string | null = null,
) {
  return {
    id: `mb-${title.toLowerCase().replace(/\W+/g, "-")}-${primary ?? "x"}`,
    title,
    "primary-type": primary,
    "secondary-types": secondary,
    "first-release-date": date,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Défaut : aucune référence amont n'est déjà attribuée. Les appels
  // `mockReturnValueOnce` des tests passent avant celui-ci.
  dbMock.select.mockReturnValue(selectChain([]));
});

describe("MAIN_RELEASE_TYPES", () => {
  it("retient les sorties principales et rien d'autre", () => {
    expect([...MAIN_RELEASE_TYPES].sort()).toEqual([
      "album",
      "demo",
      "ep",
      "live",
    ]);
  });
});

describe("importDiscographyForBand", () => {
  it("écarte singles, compilations et sorties sans type", async () => {
    const { albumValues } = captureInserts();
    dbMock.select.mockReturnValueOnce(selectChain([]));
    providerMock.listReleaseGroups.mockResolvedValue([
      rg("Un Album", "Album", [], "1985-03-01"),
      rg("Un EP", "EP"),
      rg("Une Démo", "Album", ["Demo"]),
      rg("Un Live", "Album", ["Live"]),
      rg("Un Single", "Single"),
      rg("Une Compilation", "Album", ["Compilation"]),
      rg("Sans Type", null),
    ]);

    const result = await importDiscographyForBand("band-1", "mbid-1");

    expect(result.imported).toBe(4);
    expect(albumValues.map((a) => a.title).sort()).toEqual([
      "Un Album",
      "Un EP",
      "Un Live",
      "Une Démo",
    ]);
  });

  it("n'écrase pas une sortie déjà présente, mais pose sa référence", async () => {
    const { albumValues, refValues } = captureInserts();
    dbMock.select.mockReturnValueOnce(
      selectChain([
        {
          id: "album-local",
          title: "To Mega Therion",
          slug: "to-mega-therion",
          type: "album",
        },
      ]),
    );
    providerMock.listReleaseGroups.mockResolvedValue([
      // Titre amont ponctué différemment : la normalisation doit apparier
      rg("To Mega Therion", "Album", [], "1985-10-01"),
    ]);

    const result = await importDiscographyForBand("band-1", "mbid-1");

    expect(result.matched).toBe(1);
    expect(result.imported).toBe(0);
    expect(albumValues).toHaveLength(0);
    expect(refValues[0]).toMatchObject({
      entityType: "album",
      entityId: "album-local",
    });
  });

  it("distingue un EP de l'album homonyme par un slug qualifié", async () => {
    // Cas Celtic Frost : « Monotheist » existe en album ET en EP, et
    // `albums_band_slug_uq` interdit deux fois le même slug par groupe.
    const { albumValues } = captureInserts();
    dbMock.select.mockReturnValueOnce(selectChain([]));
    providerMock.listReleaseGroups.mockResolvedValue([
      rg("Monotheist", "Album", [], "2006-05-26"),
      rg("Monotheist", "EP", [], "2006"),
    ]);

    const result = await importDiscographyForBand("band-1", "mbid-1");

    expect(result.imported).toBe(2);
    expect(albumValues.map((a) => a.slug)).toEqual([
      "monotheist",
      "monotheist-ep",
    ]);
    expect(albumValues.map((a) => a.type)).toEqual(["album", "ep"]);
  });

  it("ne retient une date que si l'amont est précis au jour", async () => {
    const { albumValues } = captureInserts();
    dbMock.select.mockReturnValueOnce(selectChain([]));
    providerMock.listReleaseGroups.mockResolvedValue([
      rg("Précis", "Album", [], "1985-10-01"),
      rg("Imprécis", "Album", [], "1985"),
    ]);

    await importDiscographyForBand("band-1", "mbid-1");

    expect(albumValues[0]).toMatchObject({
      releaseDate: "1985-10-01",
      releaseYear: 1985,
    });
    // Année conservée, date laissée vide plutôt qu'inventée au 1er janvier
    expect(albumValues[1]).toMatchObject({
      releaseDate: null,
      releaseYear: 1985,
    });
  });

  it("écarte un titre dont aucun slug ne peut être tiré", async () => {
    const { albumValues } = captureInserts();
    dbMock.select.mockReturnValueOnce(selectChain([]));
    providerMock.listReleaseGroups.mockResolvedValue([rg("???", "Album")]);

    const result = await importDiscographyForBand("band-1", "mbid-1");

    expect(result.imported).toBe(0);
    expect(result.skipped[0]).toContain("slug impossible");
    expect(albumValues).toHaveLength(0);
  });

  it("ne crée qu'une sortie quand deux œuvres amont sont homonymes", async () => {
    // Régression : MusicBrainz publie parfois deux release-groups
    // distincts sous le même titre ET le même type (rééditions
    // séparées). L'index des sorties connues n'étant pas mis à jour
    // après création, le second produisait un doublon local —
    // « thulcandra » et « thulcandra-demo » pour la même démo.
    const { albumValues } = captureInserts();
    dbMock.select.mockReturnValueOnce(selectChain([]));
    providerMock.listReleaseGroups.mockResolvedValue([
      { ...rg("Thulcandra", "Album", ["Demo"], "1989"), id: "mb-a" },
      { ...rg("Thulcandra", "Album", ["Demo"], "1992"), id: "mb-b" },
    ]);

    const result = await importDiscographyForBand("band-1", "mbid-1");

    expect(result.imported).toBe(1);
    // `matched` compte les sorties LOCALES appariées : il n'y en avait
    // aucune au départ. Le second release-group est simplement ignoré.
    expect(result.matched).toBe(0);
    expect(albumValues.map((a) => a.slug)).toEqual(["thulcandra"]);
  });

  it("refuse de déplacer une référence amont déjà attribuée", async () => {
    // `external_refs_provider_external_idx` impose qu'un identifiant
    // MusicBrainz ne désigne qu'une entité locale. Sans contrôle
    // préalable, l'insertion levait et faisait échouer tout l'import.
    captureInserts();
    dbMock.select
      .mockReturnValueOnce(
        selectChain([
          {
            id: "album-a",
            title: "Panzerfaust",
            slug: "panzerfaust",
            type: "album",
          },
        ]),
      )
      // Le contrôle de propriété : la référence est tenue par un autre
      .mockReturnValueOnce(selectChain([{ entityId: "un-autre-album" }]));
    providerMock.listReleaseGroups.mockResolvedValue([
      rg("Panzerfaust", "Album", [], "1995"),
    ]);

    const result = await importDiscographyForBand("band-1", "mbid-1");

    expect(result.matched).toBe(1);
    expect(result.skipped[0]).toContain("référence déjà attribuée");
  });
});
