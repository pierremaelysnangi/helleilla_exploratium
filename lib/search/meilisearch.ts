import { Meilisearch } from "meilisearch";
import { env } from "@/lib/env";

export const meilisearch = new Meilisearch({
  host: env.MEILI_HOST,
  apiKey: env.MEILI_MASTER_KEY,
});

export const bandsIndex = meilisearch.index("bands");
export const albumsIndex = meilisearch.index("albums");
export const tracksIndex = meilisearch.index("tracks");

export async function testMeiliConnection() {
  const health = await meilisearch.health();
  console.info("✅ Meilisearch:", health.status);
}
