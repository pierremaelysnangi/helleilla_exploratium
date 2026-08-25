/**
 * Mutations des contributions (`contributions`).
 * Encapsule les transitions du workflow de médiation : création,
 * demande de preuves (avec relance et échéance), ajout de preuves,
 * approbation, rejet terminal et expiration automatique.
 */

// Instance Drizzle partagée
import { db } from "@/db";
import { contributions } from "@/db/schema";
// Types de preuves validées côté API
import type { EvidenceItem } from "@/lib/validations/contribution";
import type { ContributionRow } from "@/db/queries/contributions";
import { eq, sql } from "drizzle-orm";

/** Paramètres de la politique d'expiration (relances / délais). */
export const CONTRIBUTION_POLICY = {
  /** Relances « preuves » avant expiration automatique. */
  maxReminders: 2,
  /** Délai accordé au contributeur après chaque relance. */
  evidenceDeadlineDays: 30,
} as const;

type ContributionInsert = typeof contributions.$inferInsert;

/** Crée un dossier de contribution en attente de relecture. */
export async function createContribution(
  data: Omit<ContributionInsert, "status">,
): Promise<ContributionRow> {
  const [row] = await db
    .insert(contributions)
    .values({ ...data, status: "pending" })
    .returning();
  return row;
}

/**
 * Le modérateur demande des preuves supplémentaires : statut
 * `evidence_requested`, note de relecture enregistrée, compteur de
 * relances incrémenté (atomiquement) et nouvelle échéance posée.
 */
export async function requestEvidence(
  contributionId: string,
  reviewerId: string,
  reviewNotes: string,
): Promise<ContributionRow | null> {
  const deadlineAt = new Date(
    Date.now() + CONTRIBUTION_POLICY.evidenceDeadlineDays * 86_400_000,
  );
  const [row] = await db
    .update(contributions)
    .set({
      status: "evidence_requested",
      reviewedBy: reviewerId,
      reviewNotes,
      deadlineAt,
      // Relance = une itération de plus vers l'expiration automatique
      reminderCount: sql`${contributions.reminderCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(contributions.id, contributionId))
    .returning();
  return row ?? null;
}

/**
 * Le contributeur ajoute des preuves : fusion avec l'existant et
 * retour au statut `pending` pour une nouvelle relecture.
 */
export async function addEvidence(
  contributionId: string,
  items: EvidenceItem[],
): Promise<ContributionRow | null> {
  const current = await db
    .select()
    .from(contributions)
    .where(eq(contributions.id, contributionId))
    .limit(1);
  if (!current[0]) return null;

  const [row] = await db
    .update(contributions)
    .set({
      // Fusion : on conserve l'historique des preuves fournies
      evidence: [...(current[0].evidence as EvidenceItem[]), ...items],
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(contributions.id, contributionId))
    .returning();
  return row ?? null;
}

/** Applique un statut terminal ou transitoire arbitré par la route. */
export async function updateStatus(
  contributionId: string,
  status: ContributionRow["status"],
  reviewerId: string,
): Promise<ContributionRow | null> {
  const [row] = await db
    .update(contributions)
    .set({ status, reviewedBy: reviewerId, updatedAt: new Date() })
    .where(eq(contributions.id, contributionId))
    .returning();
  return row ?? null;
}

/**
 * Expiration automatique : passe en `expired` les contributions en
 * attente de preuve dont l'échéance est dépassée ET qui ont déjà reçu
 * le nombre maximal de relances.
 *
 * @returns Les identifiants des contributions expirées à ce tour.
 */
export async function expireStaleContributions(): Promise<string[]> {
  const stale = await db
    .select()
    .from(contributions)
    .where(eq(contributions.status, "evidence_requested"));

  const now = new Date();
  const toExpire = stale.filter(
    (c) =>
      c.reminderCount >= CONTRIBUTION_POLICY.maxReminders &&
      c.deadlineAt !== null &&
      c.deadlineAt <= now,
  );

  for (const c of toExpire) {
    await db
      .update(contributions)
      .set({ status: "expired", updatedAt: now })
      .where(eq(contributions.id, c.id));
  }
  return toExpire.map((c) => c.id);
}
