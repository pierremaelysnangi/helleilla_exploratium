/**
 * @file Écritures du forum.
 *
 * Aucune mise à jour : un avis se publie ou se retire, il ne se réécrit
 * pas. Laisser modifier un message déjà lu et déjà cité changerait le
 * sens d'une discussion après coup — c'est le même raisonnement qui
 * interdit de réécrire une contribution approuvée.
 */

import { db } from "@/db";
import { forumPosts } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Un avis fraîchement publié, tel que la route le renvoie. */
export type CreatedForumPost = typeof forumPosts.$inferSelect;

/**
 * Publie un avis.
 *
 * @param input - Auteur, sujet (groupe OU album) et texte.
 * @returns La ligne créée.
 */
export async function createForumPost(input: {
  userId: string;
  bandId?: string;
  albumId?: string;
  body: string;
}): Promise<CreatedForumPost> {
  const [row] = await db
    .insert(forumPosts)
    .values({
      userId: input.userId,
      bandId: input.bandId ?? null,
      albumId: input.albumId ?? null,
      body: input.body,
    })
    .returning();
  return row;
}

/**
 * Retire un avis.
 *
 * Le droit de le faire — auteur ou modération — est vérifié par la
 * route : cette fonction ne connaît que l'identifiant.
 */
export async function deleteForumPost(id: string): Promise<void> {
  await db.delete(forumPosts).where(eq(forumPosts.id, id));
}
