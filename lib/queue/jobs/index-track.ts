import { trackIndexQueue } from "@/lib/queue/client";
import { getTrackById } from "@/db/queries/tracks";
import { meilisearch } from "@/lib/search/meilisearch";

export type TrackIndexJobData = {
  trackId: string;
  action: "index" | "delete";
};

export async function enqueueTrackIndex(
  trackId: string,
  action: "index" | "delete" = "index",
) {
  await trackIndexQueue.add(
    `track-${action}`,
    { trackId, action },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

export async function processTrackIndex(data: TrackIndexJobData) {
  if (data.action === "delete") {
    await meilisearch.index("tracks").deleteDocument(data.trackId);
    console.log(`✅ Track ${data.trackId} supprimé de Meilisearch`);
    return;
  }

  const track = await getTrackById(data.trackId);
  if (!track) {
    console.warn(`⚠️ Track ${data.trackId} introuvable`);
    return;
  }

  await meilisearch.index("tracks").addDocuments([
    {
      id: track.id,
      title: track.title,
      albumId: track.albumId,
      trackNumber: track.trackNumber,
      durationMs: track.durationMs,
    },
  ]);

  console.log(`✅ Track ${track.title} indexé dans Meilisearch`);
}
