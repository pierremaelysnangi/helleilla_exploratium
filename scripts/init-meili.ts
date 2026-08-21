import { meili, INDEXES } from "../lib/meili";

async function main() {
  // --- Index BANDS ---
  await meili.createIndex(INDEXES.bands, { primaryKey: "id" }).catch(() => {});
  await meili.index(INDEXES.bands).updateSettings({
    searchableAttributes: ["name", "aliases", "country", "genres"],
    filterableAttributes: ["country", "genres", "status", "formedYear"],
    sortableAttributes: ["name", "formedYear"],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    // Pertinence : nom exact d'abord, puis le reste
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
    ],
  });
  console.log("✅ Index bands configuré");

  // --- Index ALBUMS ---
  await meili.createIndex(INDEXES.albums, { primaryKey: "id" }).catch(() => {});
  await meili.index(INDEXES.albums).updateSettings({
    searchableAttributes: ["title", "bandName", "label"],
    filterableAttributes: ["bandId", "type", "releaseYear", "genres"],
    sortableAttributes: ["releaseYear", "title"],
  });
  console.log("✅ Index albums configuré");

  // --- Index TRACKS ---
  await meili.createIndex(INDEXES.tracks, { primaryKey: "id" }).catch(() => {});
  await meili.index(INDEXES.tracks).updateSettings({
    searchableAttributes: ["title", "albumTitle", "bandName"],
    filterableAttributes: ["albumId", "bandId"],
    sortableAttributes: ["trackNumber"],
  });
  console.log("✅ Index tracks configuré");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});