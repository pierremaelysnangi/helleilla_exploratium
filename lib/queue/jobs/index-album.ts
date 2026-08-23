import { albumIndexQueue } from "@/lib/queue/client";
import { getAlbumById } from "@/db/queries/albums";
import { meilisearch } from "@/lib/search/meilisearch";

export type AlbumIndexJobData = {
  albumId: string;
  action: "index" | "delete";
};

export async function enqueueAlbumIndex(
  albumId: string,
  action: "index" | "delete" = "index",
) {
  await albumIndexQueue.add(
    `album-${action}`,
    { albumId, action },
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

export async function processAlbumIndex(data: AlbumIndexJobData) {
  if (data.action === "delete") {
    await meilisearch.index("albums").deleteDocument(data.albumId);
    console.log(`✅ Album ${data.albumId} supprimé de Meilisearch`);
    return;
  }

  const album = await getAlbumById(data.albumId);
  if (!album) {
    console.warn(`⚠️ Album ${data.albumId} introuvable`);
    return;
  }

  await meilisearch.index("albums").addDocuments([
    {
      id: album.id,
      title: album.title,
      slug: album.slug,
      bandId: album.bandId,
      type: album.type,
      releaseDate: album.releaseDate,
    },
  ]);

  console.log(`✅ Album ${album.title} indexé dans Meilisearch`);
}
