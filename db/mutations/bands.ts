/**
 * @file Mutations (écritures) sur la table `bands`.
 *
 * Regroupe les fonctions de création, mise à jour et suppression d'un groupe,
 * y compris une version transactionnelle qui associe les genres au moment
 * de la création.
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Tables `bands` et table de jonction `bandGenres`
import { bands, bandGenres } from "@/db/schema";
// Opérateur d'égalité pour construire les clauses WHERE
import { eq } from "drizzle-orm";

/**
 * Crée un nouveau groupe en base, sans genres associés.
 * @param data - Données d'insertion conformes au type d'insertion Drizzle de `bands`.
 * @returns Le groupe créé.
 */
export async function createBand(data: typeof bands.$inferInsert) {
  const [band] = await db.insert(bands).values(data).returning();
  return band;
}

/**
 * Crée un groupe et ses associations genres dans une transaction unique :
 * soit tout réussit, soit rien n'est écrit (atomicité garantie).
 * @param bandData - Données du groupe à insérer.
 * @param genreIds - Identifiants des genres à associer au groupe.
 * @returns Le groupe créé (avec ses liens vers les genres).
 */
export async function createBandWithGenres(
  bandData: typeof bands.$inferInsert,
  genreIds: string[],
) {
  return db.transaction(async (tx) => {
    // Insertion du groupe dans la transaction
    const [band] = await tx.insert(bands).values(bandData).returning();

    // Association des genres uniquement si au moins un identifiant est fourni
    if (genreIds.length > 0) {
      await tx
        .insert(bandGenres)
        .values(genreIds.map((genreId) => ({ bandId: band.id, genreId })));
    }

    return band;
  });
}

/**
 * Met à jour un groupe existant et rafraîchit automatiquement `updatedAt`.
 * @param id - Identifiant UUID du groupe à modifier.
 * @param data - Champs partiels à mettre à jour.
 * @returns Le groupe mis à jour, ou undefined si aucun groupe ne correspond.
 */
export async function updateBand(
  id: string,
  data: Partial<typeof bands.$inferInsert>,
) {
  const [band] = await db
    .update(bands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bands.id, id))
    .returning();
  return band;
}

/**
 * Supprime un groupe par son identifiant.
 * Les albums, pistes et associations genres liés sont supprimés en cascade.
 * @param id - Identifiant UUID du groupe à supprimer.
 */
export async function deleteBand(id: string) {
  await db.delete(bands).where(eq(bands.id, id));
}

/**
 * Remplace l'intégralité des genres associés à un groupe (sync idempotente).
 * Exécuté en transaction : suppression des associations existantes puis
 * insertion du nouvel ensemble — le groupe se retrouve sans genre si la
 * liste est vide.
 *
 * @param bandId - UUID du groupe concerné.
 * @param genreIds - UUIDs des genres cibles ; les inconnus lèveront une
 *   violation FK (convertie en 422 par le pipeline `route()`).
 */
export async function setBandGenres(bandId: string, genreIds: string[]) {
  await db.transaction(async (tx) => {
    await tx.delete(bandGenres).where(eq(bandGenres.bandId, bandId));
    if (genreIds.length > 0) {
      await tx
        .insert(bandGenres)
        .values(genreIds.map((genreId) => ({ bandId, genreId })));
    }
  });
}
