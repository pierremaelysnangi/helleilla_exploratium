/**
 * Tests du contrat des avis de forum.
 *
 * La règle centrale — un sujet, et un seul — est portée à deux endroits :
 * ici, pour rendre un message au formulaire, et par la contrainte
 * `forum_posts_one_subject` en base, qui tient face à une écriture
 * passant ailleurs. Ces tests verrouillent la borne applicative.
 */

import { describe, it, expect } from "vitest";
import { createForumPostSchema, forumBodySchema } from "./forum";
import {
  FORUM_POST_MIN_LENGTH,
  FORUM_POST_MAX_LENGTH,
} from "@/db/schema/forum";

const BAND = "550e8400-e29b-41d4-a716-446655440000";
const ALBUM = "550e8400-e29b-41d4-a716-446655440001";
const BODY = "Un disque qui n'a pas pris une ride.";

describe("forumBodySchema", () => {
  it("refuse un texte trop court", () => {
    expect(forumBodySchema.safeParse("bof").success).toBe(false);
  });

  it("accepte un texte à la longueur minimale exacte", () => {
    expect(
      forumBodySchema.safeParse("a".repeat(FORUM_POST_MIN_LENGTH)).success,
    ).toBe(true);
  });

  it("refuse un texte au-delà de la longueur maximale", () => {
    expect(
      forumBodySchema.safeParse("a".repeat(FORUM_POST_MAX_LENGTH + 1)).success,
    ).toBe(false);
  });

  it("compte la longueur APRÈS avoir retiré les espaces de bord", () => {
    // Sans cela, dix espaces suffiraient à publier un message vide.
    expect(forumBodySchema.safeParse(`   ${"  ".repeat(6)}   `).success).toBe(
      false,
    );
  });
});

describe("createForumPostSchema", () => {
  it("accepte un avis sur un groupe", () => {
    expect(
      createForumPostSchema.safeParse({ bandId: BAND, body: BODY }).success,
    ).toBe(true);
  });

  it("accepte un avis sur un album", () => {
    expect(
      createForumPostSchema.safeParse({ albumId: ALBUM, body: BODY }).success,
    ).toBe(true);
  });

  it("refuse un avis sans sujet", () => {
    expect(createForumPostSchema.safeParse({ body: BODY }).success).toBe(false);
  });

  it("refuse un avis portant sur les deux à la fois", () => {
    // Un même texte ne peut pas commenter un groupe ET un de ses albums :
    // il apparaîtrait dans deux fils sans qu'on sache lequel il vise.
    expect(
      createForumPostSchema.safeParse({
        bandId: BAND,
        albumId: ALBUM,
        body: BODY,
      }).success,
    ).toBe(false);
  });

  it("refuse un identifiant de sujet qui n'est pas un UUID", () => {
    expect(
      createForumPostSchema.safeParse({ bandId: "emperor", body: BODY })
        .success,
    ).toBe(false);
  });
});
