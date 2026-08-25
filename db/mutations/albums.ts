/**
 * @file Mutations (écritures) sur la table `albums`.
 *
 * Regroupe les fonctions de création, mise à jour et suppression d'un album.
 * Toutes les fonctions utilisent l'instance Drizzle `db` et retournent
 * les lignes affectées grâce à `.returning()`.
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Table `albums` définie dans le schéma
import { albums } from "@/db/schema";
// Opérateur d'égalité pour construire les clauses WHERE
import { eq } from "drizzle-orm";

/**
 * Crée un nouvel album en base.
 * @param data - Données d'insertion conformes au type d'insertion Drizzle de `albums`.
 * @returns L'album créé (ou undefined si l'insertion échoue silencieusement).
 */
export async function createAlbum(data: typeof albums.$inferInsert) {
  const [album] = await db.insert(albums).values(data).returning();
  return album;
}

/**
 * Met à jour un album existant et rafraîchit automatiquement `updatedAt`.
 * @param id - Identifiant UUID de l'album à modifier.
 * @param data - Champs partiels à mettre à jour.
 * @returns L'album mis à jour, ou undefined si aucun album ne correspond.
 */
export async function updateAlbum(
  id: string,
  data: Partial<typeof albums.$inferInsert>,
) {
  const [album] = await db
    .update(albums)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(albums.id, id))
    .returning();
  return album;
}

/**
 * Supprime un album par son identifiant.
 * Les pistes liées sont supprimées en cascade (contrainte FK).
 * @param id - Identifiant UUID de l'album à supprimer.
 */
export async function deleteAlbum(id: string) {
  await db.delete(albums).where(eq(albums.id, id));
}
