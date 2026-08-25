/**
 * Client Meilisearch partagé et noms des index de recherche.
 * Point d'entrée central pour interroger/configurer l'instance Meilisearch.
 */

// SDK officiel Meilisearch
import { Meilisearch } from "meilisearch";
import { env } from "./env"; // Variables d'environnement validées

/**
 * Instance du client Meilisearch authentifiée avec la clé maître.
 * Utilisée pour les opérations d'administration et de recherche.
 */
export const meili = new Meilisearch({
  host: env.MEILI_HOST,
  apiKey: env.MEILI_MASTER_KEY,
});

// Noms des index Meilisearch, référencés par les workers et le script d'initialisation
export const INDEXES = {
  bands: "bands",
  albums: "albums",
  tracks: "tracks",
} as const;
