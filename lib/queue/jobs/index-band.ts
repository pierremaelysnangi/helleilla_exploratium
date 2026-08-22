import { bandIndexQueue } from "@/lib/queue/client";
import { getBandById } from "@/db/queries/bands";
import { meilisearch } from "@/lib/search/meilisearch";

export type BandIndexJobData = {
  bandId: string;
  action: "index" | "delete";
};

export async function enqueueBandIndex(bandId: string, action: "index" | "delete" = "index") {
  await bandIndexQueue.add(
    `band-${action}`,
    { bandId, action },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

export async function processBandIndex(data: BandIndexJobData) {
  if (data.action === "delete") {
    await meilisearch.index("bands").deleteDocument(data.bandId);
    console.log(`✅ Band ${data.bandId} supprimé de Meilisearch`);
    return;
  }

  const band = await getBandById(data.bandId);
  if (!band) {
    console.warn(`⚠️ Band ${data.bandId} introuvable`);
    return;
  }

  await meilisearch.index("bands").addDocuments([
    {
      id: band.id,
      name: band.name,
      slug: band.slug,
      bio: band.bio,
      countryCode: band.countryCode,
      formedYear: band.formedYear,
    },
  ]);

  console.log(`✅ Band ${band.name} indexé dans Meilisearch`);
}

