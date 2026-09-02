/**
 * Tests du contrat de validation des groupes.
 * Couvre la règle métier sur les années (dissolution >= formation) et la
 * validation du fichier image, dont les trois refus (fichier vide, taille,
 * format) n'étaient jamais exercés.
 */

// API Vitest : suites, tests et assertions
import { describe, it, expect } from "vitest";
// Schémas sous test
import { createBandSchema, updateBandSchema, imageFileSchema } from "./band";

/** Groupe minimal valide, surchargeable champ à champ. */
function band(overrides: Record<string, unknown> = {}) {
  return { name: "Necrofrost", slug: "necrofrost", ...overrides };
}

describe("createBandSchema", () => {
  it("accepte un groupe minimal (nom + slug)", () => {
    expect(createBandSchema.safeParse(band()).success).toBe(true);
  });

  it("refuse un slug qui n'est pas en kebab-case", () => {
    expect(
      createBandSchema.safeParse(band({ slug: "Pas Un Slug" })).success,
    ).toBe(false);
  });

  it("refuse une année de formation dans le futur", () => {
    const futur = new Date().getFullYear() + 1;
    expect(
      createBandSchema.safeParse(band({ formedYear: futur })).success,
    ).toBe(false);
  });

  it("refuse un code pays qui n'est pas en ISO 3166-1 alpha-2", () => {
    expect(
      createBandSchema.safeParse(band({ countryCode: "France" })).success,
    ).toBe(false);
  });
});

describe("withYearRule — cohérence des années", () => {
  it("refuse une dissolution antérieure à la formation", () => {
    const res = createBandSchema.safeParse(
      band({ formedYear: 1995, dissolvedYear: 1990 }),
    );

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toEqual(["dissolvedYear"]);
    }
  });

  it("accepte une dissolution la même année que la formation", () => {
    expect(
      createBandSchema.safeParse(
        band({ formedYear: 1995, dissolvedYear: 1995 }),
      ).success,
    ).toBe(true);
  });

  it("accepte un groupe encore actif (sans année de dissolution)", () => {
    expect(createBandSchema.safeParse(band({ formedYear: 1995 })).success).toBe(
      true,
    );
  });
});

describe("imageFileSchema", () => {
  it("accepte l'absence de fichier (champ optionnel)", () => {
    expect(imageFileSchema.safeParse(undefined).success).toBe(true);
  });

  it("accepte un PNG non vide", () => {
    const file = new File(["binaire"], "logo.png", { type: "image/png" });
    expect(imageFileSchema.safeParse(file).success).toBe(true);
  });

  it("refuse un fichier vide", () => {
    const file = new File([], "vide.png", { type: "image/png" });
    expect(imageFileSchema.safeParse(file).success).toBe(false);
  });

  it("refuse une image de plus de 5 Mo", () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "enorme.png", {
      type: "image/png",
    });
    expect(imageFileSchema.safeParse(file).success).toBe(false);
  });

  it("refuse un format non supporté (GIF)", () => {
    const file = new File(["binaire"], "anime.gif", { type: "image/gif" });
    expect(imageFileSchema.safeParse(file).success).toBe(false);
  });
});

describe("updateBandSchema", () => {
  it("exige un id au format UUID", () => {
    expect(updateBandSchema.safeParse({ id: "pas-un-uuid" }).success).toBe(
      false,
    );
  });

  it("accepte une mise à jour partielle avec un id valide", () => {
    expect(
      updateBandSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Nouveau nom",
      }).success,
    ).toBe(true);
  });
});
