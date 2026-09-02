/**
 * Tests du remplissage des tracklists (lib/media/tracklists.ts).
 *
 * Deux invariants comptent ici :
 * - une tracklist déjà saisie n'est JAMAIS réécrite (un contributeur a
 *   pu la corriger à la main) ;
 * - une durée ABSENTE est complétée, car sans elle la durée totale d'un
 *   album ne peut pas être calculée et la fiche n'affiche que des tirets.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/** Base factice : chaîne Drizzle réduite à ce que le module appelle. */
const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/db", () => ({ db: dbMock }));

const providerMock = vi.hoisted(() => ({ listReleaseGroupTracks: vi.fn() }));
vi.mock("@/lib/providers/musicbrainz", () => providerMock);

const { fillMissingTracklists } = await import("./tracklists");

/** Chaîne de lecture : `.from().innerJoin().where()` puis await. */
function selectChain(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  for (const m of ["from", "innerJoin", "where"]) c[m] = vi.fn(() => c);
  c.then = (resolve: (v: unknown) => void) => resolve(rows);
  return c;
}

/** Chaîne d'écriture : `.set().where()`. */
function updateChain(spy: (values: unknown) => void) {
  const c: Record<string, unknown> = {};
  c.set = vi.fn((values: unknown) => {
    spy(values);
    return c;
  });
  c.where = vi.fn(async () => undefined);
  return c;
}

const ALBUM = {
  id: "album-1",
  title: "In the Nightside Eclipse",
  releaseGroupId: "rg-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fillMissingTracklists", () => {
  it("complète les durées manquantes sans réécrire la tracklist", async () => {
    const setSpy = vi.fn();
    dbMock.select.mockReturnValueOnce(selectChain([ALBUM])).mockReturnValueOnce(
      selectChain([
        { id: "t1", title: "Into the Infinity of Thoughts", durationMs: null },
        { id: "t2", title: "Inno a Satana", durationMs: 222_000 },
        // Titre absent en amont : la durée doit rester vide plutôt que
        // d'emprunter celle d'un autre morceau.
        { id: "t3", title: "Titre d'une réédition", durationMs: null },
      ]),
    );
    dbMock.update.mockReturnValue(updateChain(setSpy));
    providerMock.listReleaseGroupTracks.mockResolvedValue([
      // Ordre volontairement différent de la tracklist locale : c'est le
      // titre qui apparie, pas la position.
      {
        trackNumber: 1,
        discNumber: 1,
        title: "Inno a Satana",
        durationMs: 999_000,
      },
      {
        trackNumber: 2,
        discNumber: 1,
        title: "Into the Infinity Of Thoughts",
        durationMs: 111_000,
      },
    ]);

    const result = await fillMissingTracklists("band-1");

    expect(result.durations).toBe(1);
    expect(result.filled).toBe(0);
    // Aucune insertion : les titres saisis localement sont intouchés
    expect(dbMock.insert).not.toHaveBeenCalled();
    // Une seule mise à jour, et seulement sur la durée
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy.mock.calls[0][0]).toMatchObject({ durationMs: 111_000 });
    // « Inno a Satana » avait déjà une durée : l'amont ne l'écrase pas
    expect(setSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ durationMs: 999_000 }),
    );
  });

  it("insère la tracklist complète quand l'album n'en a aucune", async () => {
    const values = vi.fn(async () => undefined);
    dbMock.select
      .mockReturnValueOnce(selectChain([ALBUM]))
      .mockReturnValueOnce(selectChain([]));
    dbMock.insert.mockReturnValue({ values });
    providerMock.listReleaseGroupTracks.mockResolvedValue([
      { trackNumber: 1, discNumber: 1, title: "Amont 1", durationMs: 111_000 },
    ]);

    const result = await fillMissingTracklists("band-1");

    expect(result.filled).toBe(1);
    expect(result.tracks).toBe(1);
    expect(values).toHaveBeenCalledOnce();
  });

  it("laisse l'album de côté si la source ne répond pas", async () => {
    dbMock.select
      .mockReturnValueOnce(selectChain([ALBUM]))
      .mockReturnValueOnce(selectChain([]));
    providerMock.listReleaseGroupTracks.mockRejectedValue(
      new Error("HTTP 503"),
    );

    const result = await fillMissingTracklists("band-1");

    expect(result.skipped).toEqual([ALBUM.title]);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });
});
