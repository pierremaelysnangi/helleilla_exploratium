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

// Handles des trois index de recherche, prêts pour les requêtes
export const bandsIndex = meilisearch.index("bands");
export const albumsIndex = meilisearch.index("albums");
export const tracksIndex = meilisearch.index("tracks");

/**
 * Vérifie la santé de l'instance Meilisearch et affiche le statut en console.
 * Utilisé dans les scripts d'initialisation / tests de fumée.
 * @returns Une promesse résolue après affichage du statut.
 */
export async function testMeiliConnection() {
  const health = await meilisearch.health();
  console.info("✅ Meilisearch:", health.status);
}
