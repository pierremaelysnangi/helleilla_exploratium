import { embeddingsQueue } from "@/lib/queue/client";

export type EmbeddingsJobData = {
  bandId: string;
  text: string;
};

export async function enqueueEmbeddings(bandId: string, text: string) {
  await embeddingsQueue.add(
    "generate-embeddings",
    { bandId, text },
    {
      attempts: 2,
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

export async function processEmbeddings(data: EmbeddingsJobData) {
  // TODO: Intégrer pgvector + OpenAI/Ollama
  console.log(`📊 Embeddings en attente pour band ${data.bandId}`);
}
