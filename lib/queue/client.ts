import { Queue } from "bullmq";

export const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const bandIndexQueue = new Queue("band-index", { connection });
export const albumIndexQueue = new Queue("album-index", { connection });
export const trackIndexQueue = new Queue("track-index", { connection });
export const embeddingsQueue = new Queue("embeddings", { connection });

export const queues = [
  bandIndexQueue,
  albumIndexQueue,
  trackIndexQueue,
  embeddingsQueue,
];

export async function testQueueConnection() {
  await bandIndexQueue.waitUntilReady();
  console.log("✅ Redis/Valkey connecté");
}

export async function closeQueues() {
  await Promise.all(queues.map((q) => q.close()));
}