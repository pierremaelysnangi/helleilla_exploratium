/**
 * @file Mutations (écritures) sur la table `tracks`.
 *
 * Regroupe les fonctions de création, mise à jour et suppression d'une piste.
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Table `tracks` définie dans le schéma
import { tracks } from "@/db/schema";
// Opérateur d'égalité pour construire les clauses WHERE
import { eq } from "drizzle-orm";

/**
 * Crée une nouvelle piste en base.
 * @param data - Données d'insertion conformes au type d'insertion Drizzle de `tracks`.
 * @returns La piste créée.
 */
export async function createTrack(data: typeof tracks.$inferInsert) {
  const [track] = await db.insert(tracks).values(data).returning();
  return track;
}

/**
 * Met à jour une piste existante et rafraîchit automatiquement `updatedAt`.
 * @param id - Identifiant UUID de la piste à modifier.
 * @param data - Champs partiels à mettre à jour.
 * @returns La piste mise à jour, ou undefined si aucune piste ne correspond.
 */
export async function updateTrack(
  id: string,
  data: Partial<typeof tracks.$inferInsert>,
) {
  const [track] = await db
    .update(tracks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tracks.id, id))
    .returning();
  return track;
}

/**
 * Supprime une piste par son identifiant.
 * @param id - Identifiant UUID de la piste à supprimer.
 */
export async function deleteTrack(id: string) {
  await db.delete(tracks).where(eq(tracks.id, id));
}
