/**
 * Tests de la hiérarchie d'écoute (lib/media/listenOrder.ts).
 *
 * L'ordre demandé va du plus direct au moins direct : site officiel ou
 * label, puis Bandcamp, Spotify, YouTube, Deezer. Les bases de données
 * et les réseaux sociaux viennent après — on y va pour se documenter,
 * pas pour écouter.
 */

import { describe, it, expect } from "vitest";
import { listenRank, byListenOrder } from "./listenOrder";

describe("listenRank", () => {
  it("place le site officiel devant toutes les plateformes", () => {
    expect(listenRank("https://emperorhorde.com/")).toBeLessThan(
      listenRank("https://emperor.bandcamp.com/"),
    );
  });

  it("respecte l'ordre bandcamp, spotify, youtube, deezer", () => {
    const ranks = [
      "https://emperor.bandcamp.com/",
      "https://open.spotify.com/artist/x",
      "https://www.youtube.com/c/x",
      "https://www.deezer.com/artist/1",
    ].map(listenRank);

    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it("relègue les bases de données et les réseaux sociaux", () => {
    expect(listenRank("https://www.discogs.com/artist/1")).toBeGreaterThan(
      listenRank("https://www.deezer.com/artist/1"),
    );
    expect(listenRank("https://www.facebook.com/x")).toBeGreaterThan(
      listenRank("https://www.discogs.com/artist/1"),
    );
  });

  it("ne met jamais en avant une URL inexploitable", () => {
    expect(listenRank("pas-une-url")).toBeGreaterThan(
      listenRank("https://www.facebook.com/x"),
    );
  });
});

describe("byListenOrder", () => {
  it("réordonne selon la hiérarchie", () => {
    const sorted = byListenOrder([
      { url: "https://www.facebook.com/emperor" },
      { url: "https://open.spotify.com/artist/x" },
      { url: "https://emperorhorde.com/" },
      { url: "https://emperor.bandcamp.com/" },
    ]);

    expect(sorted.map((l) => new URL(l.url).hostname)).toEqual([
      "emperorhorde.com",
      "emperor.bandcamp.com",
      "open.spotify.com",
      "www.facebook.com",
    ]);
  });

  it("préserve l'ordre d'origine entre liens de même rang", () => {
    // Deux comptes officiels d'une même plateforme : rien ne justifie
    // d'en promouvoir un, l'ordre de la source fait foi.
    const sorted = byListenOrder([
      { url: "https://open.spotify.com/artist/a" },
      { url: "https://open.spotify.com/artist/b" },
    ]);
    expect(sorted[0].url).toContain("/a");
  });
});
