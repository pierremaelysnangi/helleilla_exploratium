import { Worker, type Job } from "bullmq";
import { connection } from "./client";
import { processBandIndex, type BandIndexJobData } from "./jobs/index-band";
import { processAlbumIndex, type AlbumIndexJobData } from "./jobs/index-album";
import { processTrackIndex, type TrackIndexJobData } from "./jobs/index-track";
import { processEmbeddings, type EmbeddingsJobData } from "./jobs/generate-embeddings";

export const bandWorker = new Worker<BandIndexJobData>(
  "band-index",
  (job: Job<BandIndexJobData>) => processBandIndex(job.data),
  { connection }
);

export const albumWorker = new Worker<AlbumIndexJobData>(
  "album-index",
  (job: Job<AlbumIndexJobData>) => processAlbumIndex(job.data),
  { connection }
);

export const trackWorker = new Worker<TrackIndexJobData>(
  "track-index",
  (job: Job<TrackIndexJobData>) => processTrackIndex(job.data),
  { connection }
);

export const embeddingsWorker = new Worker<EmbeddingsJobData>(
  "embeddings",
  (job: Job<EmbeddingsJobData>) => processEmbeddings(job.data),
  { connection }
);

const workers = [bandWorker, albumWorker, trackWorker, embeddingsWorker];

workers.forEach((worker) => {
  worker.on("completed", (job) => {
    console.log(`✅ [${worker.name}] Job ${job.id} complété`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [${worker.name}] Job ${job?.id} échoué:`, err?.message);
  });
});

// Arrêt propre (Ctrl+C)
async function shutdown() {
  console.log("\n🛑 Arrêt des workers...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("🚀 Workers lancés");
