/**
 * Client BullMQ : configuration de connexion Redis/Valkey et instances
 * des files utilisées par l'application (indexation band/album/track et
 * génération d'embeddings). Expose aussi des helpers de test/arrêt.
 */

// File d'attente persistante BullMQ
import { Queue } from "bullmq";
// Connexion Redis partagée (REDIS_URL, maxRetriesPerRequest: null requis
// par BullMQ) — source unique avec lib/redis.ts
import { redisConnection as connection } from "@/lib/redis";

// Files métiers : une par type d'entité + embeddings + maintenance
export const bandIndexQueue = new Queue("band-index", { connection });
export const albumIndexQueue = new Queue("album-index", { connection });
export const trackIndexQueue = new Queue("track-index", { connection });
export const embeddingsQueue = new Queue("embeddings", { connection });
/** Tâches récurrentes de maintenance (expiration des contributions…). */
export const maintenanceQueue = new Queue("maintenance", { connection });

/** Liste exhaustive des files, utile pour les fermer en bloc. */
export const queues = [
  bandIndexQueue,
  albumIndexQueue,
  trackIndexQueue,
  embeddingsQueue,
  maintenanceQueue,
];

/**
 * Vérifie la connexion à Redis en attendant que la première file
 * soit prête ; journalise le résultat.
 */
export async function testQueueConnection() {
  await bandIndexQueue.waitUntilReady();
  console.log("✅ Redis/Valkey connecté");
}

/** Ferme proprement toutes les files (à appeler à l'arrêt du process). */
export async function closeQueues() {
  await Promise.all(queues.map((q) => q.close()));
}
