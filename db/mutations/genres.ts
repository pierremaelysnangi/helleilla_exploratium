/**
 * @file Mutations (écritures) sur la table `genres`.
 *
 * Regroupe les fonctions de création, mise à jour et suppression d'un genre.
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Table `genres` définie dans le schéma
import { genres } from "@/db/schema";
// Opérateur d'égalité pour construire les clauses WHERE
import { eq } from "drizzle-orm";

/**
 * Crée un nouveau genre en base.
 * @param data - Données d'insertion conformes au type d'insertion Drizzle de `genres`
 *   (`parentId` optionnel pour créer un sous-genre).
 * @returns Le genre créé.
 */
export async function createGenre(data: typeof genres.$inferInsert) {
  const [genre] = await db.insert(genres).values(data).returning();
  return genre;
}

/**
 * Met à jour un genre existant.
 * @param id - Identifiant UUID du genre à modifier.
 * @param data - Champs partiels à mettre à jour.
 * @returns Le genre mis à jour, ou undefined si aucun genre ne correspond.
 */
export async function updateGenre(
  id: string,
  data: Partial<typeof genres.$inferInsert>,
) {
  const [genre] = await db
    .update(genres)
    // `updatedAt` rafraîchi ici comme pour les autres entités : sans cela
    // la colonne resterait figée à la date de création.
    .set({ ...data, updatedAt: new Date() })
    .where(eq(genres.id, id))
    .returning();
  return genre;
}

/**
 * Supprime un genre par son identifiant.
 * Les associations `band_genres` liées sont supprimées en cascade.
 * @param id - Identifiant UUID du genre à supprimer.
 */
export async function deleteGenre(id: string) {
  await db.delete(genres).where(eq(genres.id, id));
}
