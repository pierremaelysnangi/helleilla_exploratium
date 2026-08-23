import { testQueueConnection } from "@/lib/queue/client";
import {
  bandWorker,
  albumWorker,
  trackWorker,
  embeddingsWorker,
} from "@/lib/queue/workers";

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

async function main() {
  await testQueueConnection();
  console.log("🎵 Workers en attente de jobs...");
}

main().catch(console.error);
