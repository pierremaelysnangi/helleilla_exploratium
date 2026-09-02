/**
 * @file Mutations des notes et listes personnelles.
 *
 * Les deux tables ont une clé primaire composée `(user_id, album_id)` :
 * les écritures sont donc des upserts, ce qui rend l'action idempotente —
 * noter deux fois le même album remplace la note au lieu d'en créer une
 * seconde qui fausserait la moyenne.
 */

import { db } from "@/db";
import { ratings, userAlbums } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Enregistre ou remplace la note d'un utilisateur sur un album. */
export async function setUserRating(
  userId: string,
  albumId: string,
  score: number,
): Promise<void> {
  await db
    .insert(ratings)
    .values({ userId, albumId, score })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.albumId],
      set: { score, updatedAt: new Date() },
    });
}

/** Retire la note d'un utilisateur sur un album. */
export async function deleteUserRating(
  userId: string,
  albumId: string,
): Promise<void> {
  await db
    .delete(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.albumId, albumId)));
}

/**
 * Place un album dans la liste personnelle, ou déplace son statut.
 *
 * Un album ne peut pas être à la fois possédé et souhaité : l'upsert
 * remplace le statut plutôt que d'ajouter une seconde ligne.
 */
export async function setUserAlbumStatus(
  userId: string,
  albumId: string,
  status: "owned" | "wanted",
): Promise<void> {
  await db
    .insert(userAlbums)
    .values({ userId, albumId, status })
    .onConflictDoUpdate({
      target: [userAlbums.userId, userAlbums.albumId],
      set: { status },
    });
}

/** Retire un album de la liste personnelle. */
export async function removeUserAlbum(
  userId: string,
  albumId: string,
): Promise<void> {
  await db
    .delete(userAlbums)
    .where(and(eq(userAlbums.userId, userId), eq(userAlbums.albumId, albumId)));
}
