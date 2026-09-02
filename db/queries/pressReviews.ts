/**
 * Lectures des critiques de presse d'un album.
 *
 * Aucun texte de critique n'est stocké ni renvoyé : seulement la
 * publication, l'auteur, la note ramenée sur 100 et le lien vers
 * l'article. Le contenu rédactionnel appartient à ses auteurs.
 */

import { db } from "@/db";
import { pressReviews } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/** Une critique telle qu'exposée par l'API. */
export type PressReview = {
  id: string;
  outlet: string;
  author: string | null;
  score: number | null;
  url: string;
  publishedAt: string | null;
};

/**
 * Critiques d'un album, de la plus récente à la plus ancienne.
 *
 * @param albumId - UUID de l'album.
 */
export async function listPressReviews(
  albumId: string,
): Promise<PressReview[]> {
  return db
    .select({
      id: pressReviews.id,
      outlet: pressReviews.outlet,
      author: pressReviews.author,
      score: pressReviews.score,
      url: pressReviews.url,
      publishedAt: pressReviews.publishedAt,
    })
    .from(pressReviews)
    .where(eq(pressReviews.albumId, albumId))
    .orderBy(desc(pressReviews.publishedAt));
}

/**
 * Moyenne de presse d'un album, sur 100.
 *
 * Renvoyée avec son EFFECTIF : une moyenne tirée d'une seule critique
 * n'a pas le même statut qu'une moyenne sur dix, et l'afficher nue
 * laisserait croire à un consensus.
 */
export async function getPressAverage(
  albumId: string,
): Promise<{ average: number | null; count: number }> {
  const [row] = await db
    .select({
      average: sql<number | null>`round(avg(${pressReviews.score}))::int`,
      count: sql<number>`count(${pressReviews.score})::int`,
    })
    .from(pressReviews)
    .where(eq(pressReviews.albumId, albumId));

  return { average: row?.average ?? null, count: row?.count ?? 0 };
}
