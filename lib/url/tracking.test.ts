/**
 * Tests du nettoyage des paramètres de pistage (lib/url/tracking.ts).
 * Vérifie la suppression des familles UTM/clic, la préservation des
 * paramètres fonctionnels et la tolérance aux URLs non analysables.
 */

import { describe, it, expect } from "vitest";
import { stripTracking } from "./tracking";

describe("stripTracking", () => {
  it("retire les paramètres UTM et le `?` devenu orphelin", () => {
    expect(
      stripTracking("https://exemple.test/album?utm_source=x&utm_medium=y"),
    ).toBe("https://exemple.test/album");
  });

  it("retire les identifiants de clic des réseaux", () => {
    expect(stripTracking("https://exemple.test/?fbclid=abc&gclid=def")).toBe(
      "https://exemple.test/",
    );
  });

  it("préserve les paramètres fonctionnels", () => {
    expect(
      stripTracking("https://exemple.test/search?q=emperor&utm_id=1"),
    ).toBe("https://exemple.test/search?q=emperor");
  });

  it("retire tout paramètre préfixé `utm_`, même inconnu", () => {
    expect(stripTracking("https://exemple.test/?utm_bidule=1")).toBe(
      "https://exemple.test/",
    );
  });

  it("renvoie l'entrée telle quelle si elle n'est pas une URL absolue", () => {
    expect(stripTracking("pas une url")).toBe("pas une url");
  });
});
