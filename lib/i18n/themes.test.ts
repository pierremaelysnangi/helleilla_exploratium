/**
 * Tests de la traduction des thèmes de textes.
 *
 * Les thèmes forment un vocabulaire fermé, contrairement aux
 * biographies : ils se traduisent. Un thème inconnu doit malgré tout
 * rester affiché, une contribution pouvant en introduire de nouveaux.
 */

import { describe, it, expect } from "vitest";
import { translateTheme } from "./themes";
import { fr } from "./locales/fr";
import { en } from "./locales/en";
import type { Dictionary } from "./dictionaries";

const dictFr = fr as unknown as Dictionary;

describe("translateTheme", () => {
  it("traduit les thèmes du répertoire", () => {
    expect(translateTheme(en, "Occultisme")).toBe("Occultism");
    expect(translateTheme(en, "Mythologie nordique")).toBe("Norse mythology");
  });

  it("ignore la casse et les accents à la comparaison", () => {
    // Les saisies varient ; le thème, lui, est le même.
    expect(translateTheme(en, "MÉLANCOLIE")).toBe("Melancholy");
    expect(translateTheme(en, "melancolie")).toBe("Melancholy");
  });

  it("rend le thème inchangé quand il est inconnu", () => {
    expect(translateTheme(en, "Spéléologie")).toBe("Spéléologie");
  });

  it("restitue le libellé français en français", () => {
    expect(translateTheme(dictFr, "Satanisme")).toBe("Satanisme");
  });
});
