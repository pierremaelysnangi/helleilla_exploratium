/**
 * Requêtes sur les références externes (table `external_refs`).
 * Lectures utilisées par le resolver média (`lib/media/resolver.ts`)
 * et les routes de consultation.
 */

// Instance Drizzle partagée
import { db } from "@/db";
// Table des références externes + types d'enum dérivés
import { externalRefs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/** Ligne de référence externe sérialisée. */
export type ExternalRefRow = typeof externalRefs.$inferSelect;

/** Valeurs possibles de l'enum `external_entity`. */
export type ExternalEntityType = ExternalRefRow["entityType"];

/**
 * Liste toutes les références externes d'une entité locale.
 *
 * @param entityType - Type d'entité (band, album, track).
 * @param entityId - UUID de l'entité.
 */
export async function getExternalRefs(
  entityType: ExternalEntityType,
  entityId: string,
): Promise<ExternalRefRow[]> {
  return db
    .select()
    .from(externalRefs)
    .where(
      and(
        eq(externalRefs.entityType, entityType),
        eq(externalRefs.entityId, entityId),
      ),
    );
}

/**
 * Récupère une référence précise (par plateforme) d'une entité.
 */
export async function getExternalRef(
  entityType: ExternalEntityType,
  entityId: string,
  provider: ExternalRefRow["provider"],
): Promise<ExternalRefRow | null> {
  const [row] = await db
    .select()
    .from(externalRefs)
    .where(
      and(
        eq(externalRefs.entityType, entityType),
        eq(externalRefs.entityId, entityId),
        eq(externalRefs.provider, provider),
      ),
    )
    .limit(1);
  return row ?? null;
}
