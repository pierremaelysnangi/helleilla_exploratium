/**
 * Tests des liens d'écoute officiels (lib/media/platformLinks.ts).
 * Vérifie la construction des URLs de recherche par plateforme,
 * l'encodage et les libellés.
 */
import { describe, it, expect } from "vitest";
import { trackSearchLinks, trackLyricsLinks } from "./platformLinks";

describe("trackSearchLinks", () => {
  const links = trackSearchLinks("Emperor", "I Am the Black Wizards");

  it("construit une URL de recherche Deezer ciblée piste", () => {
    expect(links.deezer.url).toBe(
      "https://www.deezer.com/search/Emperor%20I%20Am%20the%20Black%20Wizards/track",
    );
    expect(links.deezer.label).toBe("Deezer");
  });

  it("couvre les quatre plateformes officielles", () => {
    expect(Object.keys(links).sort()).toEqual([
      "bandcamp",
      "deezer",
      "spotify",
      "youtube",
    ]);
  });

  it("encode correctement les titres avec caractères spéciaux", () => {
    const special = trackSearchLinks(
      "Cân Bardd",
      "Mae Hen Wlad Fy Nhadau (Intro)",
    );
    // Parenthèses supprimées, accents conservés encodés
    expect(special.youtube.url).not.toContain("(");
    expect(special.youtube.url).toContain("search_query=");
  });
});

describe("trackLyricsLinks", () => {
  it("construit l'adresse AZLyrics attendue", () => {
    const links = trackLyricsLinks(
      "Paradise Lost",
      "As I Die",
      "Shades of God",
    );
    expect(links.azlyrics?.url).toBe(
      "https://www.azlyrics.com/lyrics/paradiselost/asidie.html",
    );
  });

  it("construit l'adresse DarkLyrics, indexée par ALBUM", () => {
    const links = trackLyricsLinks(
      "Paradise Lost",
      "As I Die",
      "Shades of God",
    );
    expect(links.darklyrics?.url).toBe(
      "http://www.darklyrics.com/lyrics/paradiselost/shadesofgod.html#1",
    );
  });

  it("réduit accents, ponctuation et espaces", () => {
    // « Mörk Gryning » et « Ur Djupet… » : les deux sites n'acceptent que
    // des lettres et des chiffres dans leurs adresses.
    const links = trackLyricsLinks(
      "Mörk Gryning",
      "Ur Djupet: Del I",
      "Tusen År Har Gått",
    );
    expect(links.azlyrics?.url).toContain("/morkgryning/urdjupetdeli.html");
    expect(links.darklyrics?.url).toContain("/morkgryning/tusenarhargatt.html");
  });

  it("omet DarkLyrics quand l'album est inconnu", () => {
    // Le site n'indexe que par album : sans lui, aucune adresse valide
    // ne peut être construite, et un lien mort vaut moins que rien.
    const links = trackLyricsLinks("Emperor", "Inno a Satana");
    expect(links.darklyrics).toBeUndefined();
    expect(links.azlyrics).toBeDefined();
  });

  it("conserve Genius, seul des trois à offrir une vraie recherche", () => {
    // Les adresses construites peuvent ne pas exister : un titre
    // orthographié autrement, un album absent. Genius reste le recours.
    const links = trackLyricsLinks("Emperor", "Inno a Satana");
    expect(links.genius?.url).toContain("genius.com/search?q=");
  });
});
