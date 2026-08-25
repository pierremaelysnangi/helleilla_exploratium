/**
 * Mutations des références externes (table `external_refs`).
 * Écritures utilisées par PUT /api/bands/:id/refs et le workflow de
 * contributions (validation d'une référence MusicBrainz/Discogs).
 */

// Instance Drizzle partagée
import { db } from "@/db";
import { externalRefs } from "@/db/schema";
// Types dérivés du schéma pour les enums provider/entity
type RefInsert = typeof externalRefs.$inferInsert;
import { and, eq, inArray, notInArray } from "drizzle-orm";

/**
 * Remplace l'ensemble des références d'une entité par la liste fournie
 * (sync idempotente, même sémantique que `setBandGenres`). Les lignes
 * existantes sont mises à jour (updatedAt), les nouvelles insérées,
 * celles absentes de la liste supprimées.
 *
 * @param entityType - Type d'entité (band, album, track).
 * @param entityId - UUID de l'entité.
 * @param refs - Références cibles { provider, externalId }.
 */
export async function setExternalRefs(
  entityType: RefInsert["entityType"],
  entityId: string,
  refs: { provider: RefInsert["provider"]; externalId: string }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    // Suppression des références qui ne sont plus dans l'ensemble cible
    if (refs.length > 0) {
      await tx.delete(externalRefs).where(
        and(
          eq(externalRefs.entityType, entityType),
          eq(externalRefs.entityId, entityId),
          notInArray(
            externalRefs.provider,
            refs.map((r) => r.provider),
          ),
        ),
      );
    } else {
      await tx
        .delete(externalRefs)
        .where(
          and(
            eq(externalRefs.entityType, entityType),
            eq(externalRefs.entityId, entityId),
          ),
        );
    }

    // Upsert : met à jour l'externalId si la plateforme est déjà liée
    for (const ref of refs) {
      await tx
        .insert(externalRefs)
        .values({ ...ref, entityType, entityId })
        .onConflictDoUpdate({
          target: [
            externalRefs.entityType,
            externalRefs.entityId,
            externalRefs.provider,
          ],
          set: { externalId: ref.externalId, updatedAt: new Date() },
        });
    }
  });
}

/**
 * Supprime toutes les références d'une entité (cascade métier lors de
 * la suppression de l'entité elle-même si besoin).
 */
export async function deleteExternalRefs(
  entityType: RefInsert["entityType"],
  entityId: string,
): Promise<void> {
  await db
    .delete(externalRefs)
    .where(
      and(
        eq(externalRefs.entityType, entityType),
        eq(externalRefs.entityId, entityId),
      ),
    );
}

/** Comptage interne utilisé par les tests d'intégration. */
export async function countExternalRefs(entityId: string): Promise<number> {
  const rows = await db
    .select()
    .from(externalRefs)
    .where(inArray(externalRefs.entityId, [entityId]));
  return rows.length;
}
