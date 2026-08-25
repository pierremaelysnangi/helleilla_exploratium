/**
 * Script de démarrage des workers BullMQ.
 * Lance les workers d'indexation (bands, albums, tracks) et le worker
 * d'embeddings, branche des logs sur leurs événements de cycle de vie,
 * puis teste la connexion à la file avant de rester en attente de jobs.
 */

// Vérification de la connexion à Redis/BullMQ
import { testQueueConnection } from "@/lib/queue/client";
// Workers à démarrer
import {
  bandWorker,
  albumWorker,
  trackWorker,
  embeddingsWorker,
} from "@/lib/queue/workers";

// Branchement des handlers de logging sur chaque worker (démarrage, exécution, succès, échec, erreur)
[bandWorker, albumWorker, trackWorker, embeddingsWorker].forEach((w) => {
  w.on("ready", () => console.log(`🟢 ${w.name} ready`));
  w.on("active", (job) =>
    console.log(`⚙️  ${w.name} processing job ${job.id}`),
  );
  w.on("completed", (job) =>
    console.log(`✅ ${w.name} completed job ${job.id}`),
  );
  w.on("failed", (job, err) =>
    console.error(`❌ ${w.name} failed job ${job?.id}:`, err.message),
  );
  w.on("error", (err) => console.error(`🔴 ${w.name} error:`, err));
});

/**
 * Point d'entrée du script : vérifie la connexion à la file de jobs
 * puis affiche un message indiquant que les workers écoutent.
 */
async function main() {
  await testQueueConnection();
  console.log("🎵 Workers en attente de jobs...");
}

// Lancement du script avec log d'erreur en cas d'échec
main().catch(console.error);
