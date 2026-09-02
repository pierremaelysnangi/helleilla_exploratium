/**
 * Registre des providers externes.
 * Point d'entrée unique reliant les valeurs de l'enum PostgreSQL
 * `external_provider` (db/schema/externalRefs.ts) à leurs implémentations.
 * Toute nouvelle plateforme = ajout d'enum + entrée ici — rien d'autre.
 */

// Implémentations par plateforme
import * as musicbrainz from "./musicbrainz";
import * as wikidata from "./wikidata";
import * as discogs from "./discogs";
import * as deezer from "./deezer";

/**
 * Valeurs de l'enum `external_provider` disposant d'un provider de
 * données. Les plateformes restantes (spotify, youtube, bandcamp,
 * bandcamp) sont des sources d'EMBED uniquement : on y stocke une
 * référence, mais aucune API de données n'est appelée.
 */
export const dataProviders = {
  musicbrainz,
  wikidata,
  discogs,
  deezer,
} as const;

/** Noms des providers de données (sous-ensemble de l'enum DB). */
export type DataProviderName = keyof typeof dataProviders;

/**
 * Disponibilité runtime : Discogs exige un token ; les autres sont
 * publics. Utilisé par le resolver pour sauter proprement un provider.
 */
export function isProviderAvailable(name: DataProviderName): boolean {
  if (name === "discogs") return discogs.isDiscogsEnabled();
  return true;
}
