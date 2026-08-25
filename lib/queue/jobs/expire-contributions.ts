/**
 * Job d'expiration automatique des contributions.
 * Clôture en `expired` les dossiers restés sans preuve après 2 relances
 * et leur échéance de 30 jours (politique CONTRIBUTION_POLICY).
 * Exécuté par un worker BullMQ récurrent (toutes les heures).
 */

// File de maintenance dédiée
import { maintenanceQueue } from "@/lib/queue/client";
// Mutation métier encapsulant la politique d'expiration
import { expireStaleContributions } from "@/db/mutations/contributions";

/** Nom du job récurrent dans la file de maintenance. */
export const EXPIRE_CONTRIBUTIONS_JOB = "expire-contributions";

/**
 * Traite une itération : expirations applicables, journalisées.
 * @returns Les identifiants des contributions passées en `expired`.
 */
export async function processExpireContributions(): Promise<string[]> {
  const expired = await expireStaleContributions();
  if (expired.length > 0) {
    console.log(`⏰ Contributions expirées : ${expired.length}`);
  }
  return expired;
}

/**
 * Enregistre le job récurrent (upsert : appelé au démarrage des workers,
 * remplace toute planification antérieure avec les mêmes options).
 */
export async function scheduleExpireContributions(): Promise<void> {
  // API BullMQ v6 : les jobs récurrents passent par le Job Scheduler
  // (upsert par identifiant stable, idempotent au redémarrage).
  await maintenanceQueue.upsertJobScheduler(
    EXPIRE_CONTRIBUTIONS_JOB,
    { every: 60 * 60 * 1000 }, // toutes les heures
    {
      name: EXPIRE_CONTRIBUTIONS_JOB,
      data: {},
      opts: { removeOnComplete: true, removeOnFail: false },
    },
  );
}
