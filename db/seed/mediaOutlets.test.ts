/**
 * Contrôles d'intégrité du recensement de la presse.
 *
 * Le jeu de départ est écrit à la main, et la règle du projet est
 * explicite : aucune adresse déduite d'un nom, aucune reconstruite
 * « logiquement ». Ces tests ne peuvent pas vérifier qu'un lien répond
 * — c'est le rôle de la vérification faite avant de l'inscrire ici —
 * mais ils attrapent ce qui se glisse dans une liste recopiée à la
 * main : un slug en double, une adresse en clair, un code pays mal
 * formé.
 */

import { describe, it, expect } from "vitest";
import { MEDIA_OUTLETS } from "./mediaOutlets";

describe("recensement de la presse", () => {
  it("n'a aucun slug en double", () => {
    const slugs = MEDIA_OUTLETS.map((outlet) => outlet.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("n'a aucun couple pays + nom en double", () => {
    // Contrainte `media_outlets_country_name_uq` : « Metal Hammer »
    // paraît au Royaume-Uni ET en Allemagne, ce sont deux rédactions.
    const pairs = MEDIA_OUTLETS.map((o) => `${o.countryCode}/${o.name}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("n'expose que des adresses en HTTPS", () => {
    for (const outlet of MEDIA_OUTLETS) {
      expect(outlet.websiteUrl, outlet.slug).toMatch(/^https:\/\//);
    }
  });

  it("porte un code pays ISO 3166-1 alpha-2", () => {
    for (const outlet of MEDIA_OUTLETS) {
      expect(outlet.countryCode, outlet.slug).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("emploie des slugs en kebab-case", () => {
    for (const outlet of MEDIA_OUTLETS) {
      expect(outlet.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("couvre plusieurs pays", () => {
    // Une page « pays par pays » qui n'en montrerait qu'un serait une
    // liste déguisée : le regroupement n'aurait plus de sens.
    const countries = new Set(MEDIA_OUTLETS.map((o) => o.countryCode));
    expect(countries.size).toBeGreaterThan(3);
  });
});
