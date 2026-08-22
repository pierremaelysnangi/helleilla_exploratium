import { Meilisearch } from "meilisearch";

export const meilisearch = new Meilisearch({
  host: process.env.MEILI_HOST || "http://localhost:7700",
  apiKey: process.env.MEILI_MASTER_KEY,
});

export const bandsIndex = meilisearch.index("bands");
export const albumsIndex = meilisearch.index("albums");
export const tracksIndex = meilisearch.index("tracks");

export async function testMeiliConnection() {
  const health = await meilisearch.health();
  console.log("✅ Meilisearch:", health.status);
}