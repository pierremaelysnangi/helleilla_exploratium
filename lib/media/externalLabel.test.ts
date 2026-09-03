/**
 * Test du libellé des liens sortants.
 *
 * La marque de lien sortant était recopiée dans six composants ; le
 * détecteur de textes non traduits y voyait autant de chaînes figées.
 */

import { describe, it, expect } from "vitest";
import { externalLabel } from "./externalLabel";

describe("externalLabel", () => {
  it("suffixe le libellé de la marque de lien sortant", () => {
    expect(externalLabel("Bandcamp")).toBe("Bandcamp ↗");
  });

  it("laisse le libellé traduit intact", () => {
    // La fonction n'ajoute rien d'autre : la traduction lui parvient
    // déjà résolue par le dictionnaire.
    expect(externalLabel("Sitio oficial")).toBe("Sitio oficial ↗");
  });
});
