/**
 * Tests du choix d'édition pour les tracklists.
 *
 * Le défaut corrigé ici se voyait à l'écran : des tracklists entières
 * affichaient « — » à la place des durées, et l'album n'annonçait aucune
 * durée totale. La cause n'était pas l'absence de données chez
 * MusicBrainz, mais notre choix d'édition — la plus ancienne, souvent
 * cataloguée sans longueurs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.hoisted(() => ({ fetchJson: vi.fn() }));
vi.mock("./http", () => httpMock);
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/redis", () => ({
  redis: { get: vi.fn(async () => null), set: vi.fn(async () => "OK") },
}));

const { listReleaseGroupTracks } = await import("./musicbrainz");

/** Fabrique une édition à un seul support. */
function release(
  date: string | null,
  tracks: { title: string; length: number | null }[],
) {
  return {
    id: `rel-${date ?? "sans-date"}-${tracks.length}`,
    title: "Un disque",
    date,
    media: [
      {
        position: 1,
        tracks: tracks.map((t, i) => ({
          position: i + 1,
          title: t.title,
          length: t.length,
        })),
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listReleaseGroupTracks", () => {
  it("retient l'édition qui renseigne le plus de durées", async () => {
    httpMock.fetchJson.mockResolvedValue({
      releases: [
        // La plus ancienne, mais sans aucune longueur : c'est elle qui
        // était choisie, et la tracklist s'affichait sans durées.
        release("1990", [
          { title: "Ancienne A", length: null },
          { title: "Ancienne B", length: null },
        ]),
        release("2005", [
          { title: "Rééditée A", length: 240_000 },
          { title: "Rééditée B", length: 300_000 },
        ]),
      ],
    });

    const tracks = await listReleaseGroupTracks("rg-1");

    expect(tracks.map((t) => t.title)).toEqual(["Rééditée A", "Rééditée B"]);
    expect(tracks.every((t) => t.durationMs !== null)).toBe(true);
  });

  it("préfère la plus ancienne quand les durées sont équivalentes", async () => {
    // À information égale, l'édition de référence est la première :
    // c'est son ordre et son découpage qui font foi.
    httpMock.fetchJson.mockResolvedValue({
      releases: [
        release("2010", [{ title: "Récente", length: 200_000 }]),
        release("1994", [{ title: "Originale", length: 200_000 }]),
      ],
    });

    const tracks = await listReleaseGroupTracks("rg-1");

    expect(tracks[0].title).toBe("Originale");
  });

  it("ignore les éditions sans aucune piste", async () => {
    httpMock.fetchJson.mockResolvedValue({
      releases: [
        { id: "vide", title: "Vide", date: "1990", media: [] },
        release("1995", [{ title: "Réelle", length: null }]),
      ],
    });

    const tracks = await listReleaseGroupTracks("rg-1");

    expect(tracks).toHaveLength(1);
    expect(tracks[0].title).toBe("Réelle");
  });

  it("renvoie une liste vide si aucune édition n'a de piste", async () => {
    httpMock.fetchJson.mockResolvedValue({ releases: [] });
    expect(await listReleaseGroupTracks("rg-1")).toEqual([]);
  });
});
