/**
 * Tests des contrats de notation et de collection.
 *
 * L'échelle de note est bornée à deux endroits — ici et par une contrainte
 * CHECK en base. Ces tests verrouillent la borne applicative ; la borne SQL
 * couvre les écritures qui ne passeraient pas par l'API.
 */
import { describe, it, expect } from "vitest";
import {
  ratingScoreSchema,
  setRatingSchema,
  setCollectionSchema,
  collectionStatusSchema,
} from "./collection";

describe("ratingScoreSchema", () => {
  it.each([1, 3, 5])("accepte la note %s", (score) => {
    expect(ratingScoreSchema.safeParse(score).success).toBe(true);
  });

  it.each([0, 6, -1])("refuse la note %s", (score) => {
    expect(ratingScoreSchema.safeParse(score).success).toBe(false);
  });

  it("refuse une note fractionnaire", () => {
    // L'échelle est entière : accepter 4,5 rendrait la moyenne trompeuse
    expect(ratingScoreSchema.safeParse(4.5).success).toBe(false);
  });

  it("convertit une saisie textuelle", () => {
    const res = ratingScoreSchema.safeParse("4");
    expect(res.success && res.data).toBe(4);
  });
});

describe("setRatingSchema", () => {
  it("exige un score", () => {
    expect(setRatingSchema.safeParse({}).success).toBe(false);
  });
});

describe("setCollectionSchema", () => {
  it("accepte un couple album + statut valide", () => {
    expect(
      setCollectionSchema.safeParse({
        albumId: "550e8400-e29b-41d4-a716-446655440000",
        status: "owned",
      }).success,
    ).toBe(true);
  });

  it("refuse un albumId qui n'est pas un UUID", () => {
    expect(
      setCollectionSchema.safeParse({ albumId: "nope", status: "owned" })
        .success,
    ).toBe(false);
  });

  it("refuse un statut hors nomenclature", () => {
    expect(
      setCollectionSchema.safeParse({
        albumId: "550e8400-e29b-41d4-a716-446655440000",
        status: "listening",
      }).success,
    ).toBe(false);
  });

  it("n'admet que deux statuts", () => {
    expect(collectionStatusSchema.options).toEqual(["owned", "wanted"]);
  });
});
