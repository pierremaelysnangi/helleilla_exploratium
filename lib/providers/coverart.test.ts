/**
 * Tests de l'appariement des œuvres MusicBrainz (lib/providers/coverart.ts).
 *
 * Le cas qui a motivé ces tests est réel : MusicBrainz publie deux
 * release-groups « Monotheist » datés 2006 pour Celtic Frost, l'un
 * `Album` et l'autre `EP`. Le titre et l'année ne suffisant pas à les
 * départager, l'appariement renvoyait `null` — l'album restait sans
 * référence canonique, donc sans tracklist.
 */

import { describe, it, expect, vi } from "vitest";

// Ce fichier n'exerce que des fonctions pures, mais le module importe le
// client HTTP partagé, qui valide l'environnement au chargement. Deux
// substituts suffisent à couper cette chaîne, comme dans providers.test.ts.
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/redis", () => ({
  redis: { get: vi.fn(async () => null), set: vi.fn(async () => "OK") },
}));

const { albumTypeOf, matchReleaseGroup, normalizeTitle } =
  await import("./coverart");
type ReleaseGroup = Awaited<
  ReturnType<typeof import("./coverart").listReleaseGroups>
>[number];

/**
 * Fabrique un release-group minimal, champs par défaut réalistes.
 *
 * `in` plutôt que `??` : un `primary-type` explicitement `null` est un
 * cas à tester, que le repli sur « Album » masquerait.
 */
function group(
  partial: Partial<ReleaseGroup> & { title: string },
): ReleaseGroup {
  return {
    id: partial.id ?? partial.title.toLowerCase().replace(/\W+/g, "-"),
    title: partial.title,
    "primary-type":
      "primary-type" in partial ? partial["primary-type"] : "Album",
    "secondary-types": partial["secondary-types"] ?? [],
    "artist-credit": partial["artist-credit"] ?? [{ name: "Un Groupe" }],
    "first-release-date": partial["first-release-date"] ?? null,
  };
}

describe("albumTypeOf", () => {
  it("fait primer le type secondaire sur le type primaire", () => {
    // MusicBrainz classe une compilation en « Album » + « Compilation » :
    // retenir le primaire la rangerait parmi les albums studio.
    expect(
      albumTypeOf(
        group({ title: "Are You Morbid?", "secondary-types": ["Compilation"] }),
      ),
    ).toBe("compilation");
    expect(
      albumTypeOf(group({ title: "Live", "secondary-types": ["Live"] })),
    ).toBe("live");
    expect(
      albumTypeOf(group({ title: "Demos", "secondary-types": ["Demo"] })),
    ).toBe("demo");
  });

  it("projette les types primaires usuels", () => {
    expect(albumTypeOf(group({ title: "A", "primary-type": "Album" }))).toBe(
      "album",
    );
    expect(albumTypeOf(group({ title: "B", "primary-type": "EP" }))).toBe("ep");
    expect(albumTypeOf(group({ title: "C", "primary-type": "Single" }))).toBe(
      "single",
    );
  });

  it("reconnaît un split à ses crédits multiples", () => {
    // « Cromlech / Spectres Over Gorgoroth » réunit Darkthrone et
    // Isengard sans porter aucun type secondaire : sans ce contrôle, il
    // atterrissait parmi les albums studio de Darkthrone.
    expect(
      albumTypeOf(
        group({
          title: "Cromlech / Spectres Over Gorgoroth",
          "primary-type": "Album",
          "artist-credit": [{ name: "Darkthrone" }, { name: "Isengard" }],
        }),
      ),
    ).toBe("split");
  });

  it("laisse une compilation multi-artistes en compilation", () => {
    // Un split et une compilation « various artists » ont tous deux
    // plusieurs crédits : c'est le type secondaire qui les sépare.
    expect(
      albumTypeOf(
        group({
          title: "The True Legends in Black",
          "primary-type": "Album",
          "secondary-types": ["Compilation"],
          "artist-credit": [{ name: "A" }, { name: "B" }],
        }),
      ),
    ).toBe("compilation");
  });

  it("n'affirme rien quand MusicBrainz ne déclare aucun type", () => {
    expect(albumTypeOf(group({ title: "D", "primary-type": null }))).toBeNull();
    expect(
      albumTypeOf(group({ title: "E", "primary-type": "Inconnu" })),
    ).toBeNull();
  });
});

describe("matchReleaseGroup", () => {
  /** Le cas Celtic Frost, tel que renvoyé par l'API. */
  const monotheistAlbum = group({
    id: "420ca414",
    title: "Monotheist",
    "primary-type": "Album",
    "first-release-date": "2006-05-26",
  });
  const monotheistEp = group({
    id: "bdc824ae",
    title: "Monotheist",
    "primary-type": "EP",
    "first-release-date": "2006",
  });

  it("départage deux homonymes de même année par leur type", () => {
    const groups = [monotheistAlbum, monotheistEp];

    expect(
      matchReleaseGroup(groups, {
        title: "Monotheist",
        releaseYear: 2006,
        type: "album",
      })?.id,
    ).toBe("420ca414");

    expect(
      matchReleaseGroup(groups, {
        title: "Monotheist",
        releaseYear: 2006,
        type: "ep",
      })?.id,
    ).toBe("bdc824ae");
  });

  it("reste indécis sans type : c'est l'ancien comportement", () => {
    // Régression : sans cette information, l'ambiguïté est réelle et le
    // refus est le bon choix — une pochette erronée est pire qu'aucune.
    expect(
      matchReleaseGroup([monotheistAlbum, monotheistEp], {
        title: "Monotheist",
        releaseYear: 2006,
      }),
    ).toBeNull();
  });

  it("refuse quand deux candidats partagent année ET type", () => {
    const jumeau = group({
      id: "autre",
      title: "Monotheist",
      "primary-type": "Album",
      "first-release-date": "2006-11-01",
    });

    expect(
      matchReleaseGroup([monotheistAlbum, jumeau], {
        title: "Monotheist",
        releaseYear: 2006,
        type: "album",
      }),
    ).toBeNull();
  });

  it("apparie un titre unique sans avoir besoin d'un départage", () => {
    expect(
      matchReleaseGroup([group({ title: "To Mega Therion" })], {
        title: "To Mega Therion",
      })?.title,
    ).toBe("To Mega Therion");
  });

  it("laisse sa chance au type quand l'année n'élimine personne", () => {
    // Aucun candidat ne porte l'année demandée : le filtre par année ne
    // doit pas vider l'ensemble, sinon le type ne peut plus trancher.
    const sansDate = [
      group({ id: "a", title: "Prototype", "primary-type": "Album" }),
      group({ id: "b", title: "Prototype", "primary-type": "EP" }),
    ];

    expect(
      matchReleaseGroup(sansDate, {
        title: "Prototype",
        releaseYear: 2002,
        type: "ep",
      })?.id,
    ).toBe("b");
  });

  it("normalise la ponctuation et les accents des titres", () => {
    expect(normalizeTitle("Blood and Fire")).toBe(
      normalizeTitle("Blood & Fire"),
    );
    expect(
      matchReleaseGroup([group({ title: "Emperor’s Return" })], {
        title: "Emperor's Return",
      }),
    ).not.toBeNull();
  });
});
