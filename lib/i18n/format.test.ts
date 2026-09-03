/**
 * Tests de l'interpolation des textes (lib/i18n/format.ts).
 */

import { describe, it, expect } from "vitest";
import { interpolate } from "./format";

describe("interpolate", () => {
  it("remplace les marqueurs par leurs valeurs", () => {
    expect(interpolate("Photo de {band}", { band: "Emperor" })).toBe(
      "Photo de Emperor",
    );
  });

  it("accepte des nombres", () => {
    expect(interpolate("{count} sorties", { count: 12 })).toBe("12 sorties");
  });

  it("laisse visible un marqueur sans valeur", () => {
    // Un blanc silencieux passerait inaperçu en relecture ; le marqueur
    // apparent signale l'oubli.
    expect(interpolate("Photo de {band}")).toBe("Photo de {band}");
  });

  it("gère plusieurs marqueurs, y compris répétés", () => {
    expect(interpolate("{a} puis {b} puis {a}", { a: "un", b: "deux" })).toBe(
      "un puis deux puis un",
    );
  });
});
