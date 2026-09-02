/**
 * Tests des liens d'écoute officiels (lib/media/platformLinks.ts).
 * Vérifie la construction des URLs de recherche par plateforme,
 * l'encodage et les libellés.
 */
import { describe, it, expect } from "vitest";
import { trackSearchLinks } from "./platformLinks";

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
