import { Meilisearch } from "meilisearch";
import { env } from "./env";

export const meili = new Meilisearch({
  host: env.MEILI_HOST,
  apiKey: env.MEILI_MASTER_KEY,
});

export const INDEXES = {
  bands: "bands",
  albums: "albums",
  tracks: "tracks",
} as const;