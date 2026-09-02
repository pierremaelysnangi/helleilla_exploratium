/**
 * Script d'initialisation de Meilisearch.
 * Crée (si besoin) et configure les trois index de recherche :
 * - bands : recherche sur nom/alias, filtres pays/genres, tolérance aux typos
 * - albums : recherche sur titre/groupe/label, filtres type/année
 * - tracks : recherche sur titre/album/groupe, tri par numéro de piste
 */

// Client Meilisearch et noms d'index (source unique du reste de l'app)
import { meilisearch as meili, INDEXES } from "../lib/search/meilisearch";

/**
 * Point d'entrée du script : crée chaque index avec `id` comme clé primaire
 * puis applique les paramètres de recherche/filtrage/tri. Ignore l'erreur
 * si l'index existe déjà (`catch(() => {})`).
 */
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

// Lancement du script avec sortie en erreur (code 1) en cas d'échec
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
