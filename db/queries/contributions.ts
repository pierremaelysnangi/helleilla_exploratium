/**
 * Requêtes sur les contributions (`contributions`).
 * Lectures pour la file de modération et l'espace contributeur.
 */

// Instance Drizzle partagée
import { db } from "@/db";
import { contributions } from "@/db/schema";
import { and, desc, eq, lte, inArray } from "drizzle-orm";

/** Ligne de contribution complète. */
export type ContributionRow = typeof contributions.$inferSelect;

/** Statuts ouverts : visibles dans la file active de modération. */
export const OPEN_STATUSES = ["pending", "evidence_requested"] as const;

/**
 * Récupère une contribution par identifiant.
 */
export async function getContributionById(
  id: string,
): Promise<ContributionRow | null> {
  const [row] = await db
    .select()
    .from(contributions)
    .where(eq(contributions.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * File de modération : contributions ouvertes (ou un statut précis),
 * les plus récemment mises à jour d'abord.
 *
 * @param status - Filtrer sur un statut ; défaut = statuts ouverts.
 * @param limit - Taille de page (défaut 20).
 */
export async function listContributionsForReview(
  status?: ContributionRow["status"],
  limit = 20,
): Promise<ContributionRow[]> {
  const where =
    status === undefined
      ? inArray(contributions.status, [...OPEN_STATUSES])
      : eq(contributions.status, status);
  return db
    .select()
    .from(contributions)
    .where(where)
    .orderBy(desc(contributions.updatedAt))
    .limit(limit);
}

/**
 * Contributions soumises par un contributeur donné (tous statuts).
 */
export async function listContributionsByUser(
  userId: string,
  limit = 20,
): Promise<ContributionRow[]> {
  return db
    .select()
    .from(contributions)
    .where(eq(contributions.submittedBy, userId))
    .orderBy(desc(contributions.updatedAt))
    .limit(limit);
}

/**
 * Contributions dont l'échéance de preuves est dépassée et qui sont
 * encore en attente de preuve — cible du job d'expiration automatique.
 */
export async function listExpiredPending(): Promise<ContributionRow[]> {
  return db
    .select()
    .from(contributions)
    .where(
      and(
        eq(contributions.status, "evidence_requested"),
        lte(contributions.deadlineAt, new Date()),
      ),
    );
}
