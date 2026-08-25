/**
 * Processus des workers BullMQ (exécuté séparément de Next.js).
 * Instancie un worker par file, branche les processeurs métiers,
 * journalise succès/échecs et gère l'arrêt propre sur SIGINT/SIGTERM.
 */

// Workers et type Job de BullMQ
import { Worker, type Job } from "bullmq";
// Connexion Redis partagée avec le client
import { redisConnection as connection } from "@/lib/redis";
// Processeurs métiers + types de données des jobs
import { processBandIndex, type BandIndexJobData } from "./jobs/index-band";
import { processAlbumIndex, type AlbumIndexJobData } from "./jobs/index-album";
import { processTrackIndex, type TrackIndexJobData } from "./jobs/index-track";
import {
  processEmbeddings,
  type EmbeddingsJobData,
} from "./jobs/generate-embeddings";
// Job récurrent d'expiration des contributions
import {
  processExpireContributions,
  scheduleExpireContributions,
  EXPIRE_CONTRIBUTIONS_JOB,
} from "./jobs/expire-contributions";

// Un worker par file : délègue simplement au processeur correspondant
export const bandWorker = new Worker<BandIndexJobData>(
  "band-index",
  (job: Job<BandIndexJobData>) => processBandIndex(job.data),
  { connection },
);

export const albumWorker = new Worker<AlbumIndexJobData>(
  "album-index",
  (job: Job<AlbumIndexJobData>) => processAlbumIndex(job.data),
  { connection },
);

export const trackWorker = new Worker<TrackIndexJobData>(
  "track-index",
  (job: Job<TrackIndexJobData>) => processTrackIndex(job.data),
  { connection },
);

export const embeddingsWorker = new Worker<EmbeddingsJobData>(
  "embeddings",
  (job: Job<EmbeddingsJobData>) => processEmbeddings(job.data),
  { connection },
);

/**
 * Worker de maintenance : traite les jobs récurrents (expiration des
 * contributions). La planification est enregistrée au démarrage du
 * worker (upsert par jobId stable).
 */
export const maintenanceWorker = new Worker(
  "maintenance",
  async (job: Job) => {
    switch (job.name) {
      case EXPIRE_CONTRIBUTIONS_JOB:
        await processExpireContributions();
        return;
      default:
        console.warn(`⚠️ Job de maintenance inconnu : ${job.name}`);
    }
  },
  { connection },
);

// Planification du job récurrent dès le démarrage du worker
void scheduleExpireContributions();

// Liste des workers, pour brancher les listeners et l'arrêt en bloc
const workers = [
  bandWorker,
  albumWorker,
  trackWorker,
  embeddingsWorker,
  maintenanceWorker,
];

// Journalisation uniforme des terminaisons de jobs
workers.forEach((worker) => {
  worker.on("completed", (job) => {
    console.log(`✅ [${worker.name}] Job ${job.id} complété`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [${worker.name}] Job ${job?.id} échoué:`, err?.message);
  });
});

/** Ferme tous les workers puis termine le processus avec le code 0. */
// Arrêt propre (Ctrl+C)
async function shutdown() {
  console.log("\n🛑 Arrêt des workers...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("🚀 Workers lancés");
