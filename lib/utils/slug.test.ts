/**
 * Tests de la fabrication des slugs (lib/utils/slug.ts).
 *
 * L'enjeu est la contrainte `albums_band_slug_uq` sur `(band_id, slug)` :
 * un import de discographie qui produirait deux fois le même slug pour un
 * groupe échouerait en base. Les titres homonymes ne sont pas un cas
 * théorique — Celtic Frost a publié un EP et un album « Monotheist ».
 */

import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./slug";

/** Le motif imposé par les schémas de validation zod. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("slugify", () => {
  it("produit un slug conforme au motif des schémas zod", () => {
    for (const title of [
      "In the Nightside Eclipse",
      "Emperor’s Return",
      "1984–1992: Parched With Thirst Am I and Dying",
      "  Espaces  multiples  ",
      "Are You Morbid?",
    ]) {
      expect(slugify(title)).toMatch(SLUG_REGEX);
    }
  });

  it("retire les diacritiques sans perdre la lettre", () => {
    expect(slugify("Mörk Gryning")).toBe("mork-gryning");
    expect(slugify("Kværneland")).toBe("kvaerneland");
    expect(slugify("Sólstafir")).toBe("solstafir");
  });

  it("transcrit « & » plutôt que de le supprimer", () => {
    // Sans cela, « Blood & Fire » et « Blood Fire » produiraient le même
    // slug : deux sorties distinctes entreraient en collision.
    expect(slugify("Blood & Fire")).toBe("blood-and-fire");
    expect(slugify("Blood & Fire")).not.toBe(slugify("Blood Fire"));
  });

  it("renvoie une chaîne vide quand rien n'est exploitable", () => {
    expect(slugify("???")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it("tronque sans laisser de tiret final", () => {
    const long = slugify("mot ".repeat(100));
    expect(long.length).toBeLessThanOrEqual(200);
    expect(long).toMatch(SLUG_REGEX);
  });
});

describe("uniqueSlug", () => {
  it("renvoie le slug tel quel s'il est libre", () => {
    expect(uniqueSlug("monotheist", new Set())).toBe("monotheist");
  });

  it("qualifie par le type avant de numéroter", () => {
    // « monotheist-ep » se lit ; « monotheist-2 » n'apprend rien.
    expect(uniqueSlug("monotheist", new Set(["monotheist"]), "ep")).toBe(
      "monotheist-ep",
    );
  });

  it("numérote quand le qualificatif est lui aussi pris", () => {
    expect(
      uniqueSlug("monotheist", new Set(["monotheist", "monotheist-ep"]), "ep"),
    ).toBe("monotheist-2");
  });

  it("ne modifie pas l'ensemble qu'on lui passe", () => {
    const taken = new Set(["monotheist"]);
    uniqueSlug("monotheist", taken, "ep");
    expect([...taken]).toEqual(["monotheist"]);
  });
});
