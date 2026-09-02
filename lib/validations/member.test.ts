/**
 * Tests des contrats membres et formations.
 */
import { describe, it, expect } from "vitest";
import {
  createMemberSchema,
  bandMembershipSchema,
  setBandMembersSchema,
} from "./member";

const MEMBER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("createMemberSchema", () => {
  it("accepte un membre minimal", () => {
    expect(
      createMemberSchema.safeParse({ name: "Ihsahn", slug: "ihsahn" }).success,
    ).toBe(true);
  });

  it("refuse un slug qui n'est pas en kebab-case", () => {
    expect(
      createMemberSchema.safeParse({ name: "Ihsahn", slug: "Pas Un Slug" })
        .success,
    ).toBe(false);
  });
});

describe("bandMembershipSchema", () => {
  it("accepte une appartenance ouverte (membre actuel)", () => {
    expect(
      bandMembershipSchema.safeParse({ memberId: MEMBER_ID, joinedYear: 1991 })
        .success,
    ).toBe(true);
  });

  it("refuse un départ antérieur à l'arrivée", () => {
    const res = bandMembershipSchema.safeParse({
      memberId: MEMBER_ID,
      joinedYear: 1995,
      leftYear: 1990,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toEqual(["leftYear"]);
    }
  });

  it("accepte un départ la même année que l'arrivée", () => {
    expect(
      bandMembershipSchema.safeParse({
        memberId: MEMBER_ID,
        joinedYear: 1995,
        leftYear: 1995,
      }).success,
    ).toBe(true);
  });

  it("refuse une année dans le futur", () => {
    expect(
      bandMembershipSchema.safeParse({
        memberId: MEMBER_ID,
        joinedYear: new Date().getFullYear() + 1,
      }).success,
    ).toBe(false);
  });
});

describe("setBandMembersSchema", () => {
  it("accepte une formation vide (détache tous les membres)", () => {
    expect(setBandMembersSchema.safeParse({ members: [] }).success).toBe(true);
  });

  it("borne la taille d'une formation", () => {
    const tooMany = Array.from({ length: 51 }, () => ({ memberId: MEMBER_ID }));
    expect(setBandMembersSchema.safeParse({ members: tooMany }).success).toBe(
      false,
    );
  });
});
