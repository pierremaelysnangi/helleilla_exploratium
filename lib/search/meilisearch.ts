/**
 * Client Meilisearch et handles des index (groupes, albums, pistes).
 * Fournit les objets `index` prêts à l'emploi et un test de santé de l'instance.
 */

// SDK officiel Meilisearch
import { Meilisearch } from "meilisearch";
import { env } from "@/lib/env"; // Variables d'environnement validées

/**
 * Instance du client Meilisearch authentifiée avec la clé maître.
 */
export const meilisearch = new Meilisearch({
  host: env.MEILI_HOST,
  apiKey: env.MEILI_MASTER_KEY,
});

/**
 * Noms des trois index, source unique partagée par les workers, le script
 * d'initialisation et les requêtes. Un second client Meilisearch existait
 * en parallèle (`lib/meili.ts`) : deux connexions pour la même instance,
 * et deux endroits où corriger un nom d'index.
 */
export const INDEXES = {
  bands: "bands",
  albums: "albums",
  tracks: "tracks",
} as const;

// Handles des trois index de recherche, prêts pour les requêtes
export const bandsIndex = meilisearch.index(INDEXES.bands);
export const albumsIndex = meilisearch.index(INDEXES.albums);
export const tracksIndex = meilisearch.index(INDEXES.tracks);

/**
 * Vérifie la santé de l'instance Meilisearch et affiche le statut en console.
 * Utilisé dans les scripts d'initialisation / tests de fumée.
 * @returns Une promesse résolue après affichage du statut.
 */
export async function testMeiliConnection() {
  const health = await meilisearch.health();
  console.info("✅ Meilisearch:", health.status);
}
