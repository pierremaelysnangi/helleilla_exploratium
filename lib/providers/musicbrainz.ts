/**
 * Provider MusicBrainz — données structurées des groupes.
 * API publique gratuite sans authentification ; User-Agent obligatoire
 * et 1 requête/seconde max (throttling géré par `fetchJson`).
 * Docs : https://musicbrainz.org/doc/MusicBrainz_API
 */

// Récupération JSON validée (cache + retry + throttle)
import { fetchJson } from "./http";
import { z } from "zod";

const BASE = "https://musicbrainz.org/ws/2";

/** Contrat partiel d'un artiste MusicBrainz (champs utiles uniquement). */
const mbArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().nullable().optional(),
  /** Zone principale (plus précise que le code pays ISO). */
  area: z.object({ name: z.string().nullable().optional() }).nullish(),
  /** Période d'activité : begin = formation, end = dissolution. */
  "life-span": z
    .object({
      begin: z.string().nullable().optional(),
      end: z.string().nullable().optional(),
      // `nullish` et non `optional` : MusicBrainz renvoie explicitement
      // `"ended": null` pour un artiste toujours actif. Avec `optional`,
      // la validation échouait — et comme fetchJson ne retente pas une
      // ZodError, TOUTE recherche renvoyant un groupe en activité était
      // perdue, y compris pour le resolver média.
      ended: z.boolean().nullish(),
    })
    .nullish(),
  /** Genres normalisés MusicBrainz. */
  genres: z
    .array(z.object({ name: z.string(), count: z.number().nullish() }))
    .nullish(),
  /**
   * Relations artiste : membres du groupe ("member of band"),
   * identifiants externes ("wikidata" dans la cible de relation).
   */
  relations: z
    .array(
      z.object({
        type: z.string(),
        direction: z.string().nullish(),
        target_type: z.string().nullish(),
        artist: z.object({ id: z.string(), name: z.string() }).nullish(),
        url: z.object({ resource: z.string() }).nullish(),
      }),
    )
    .nullish(),
});

export type MbArtist = z.infer<typeof mbArtistSchema>;

/** Résultat de recherche : liste d'artiste + score. */
export const mbSearchResultSchema = z.object({
  artists: z.array(mbArtistSchema.extend({ score: z.number().nullish() })),
});

/**
 * Recherche d'artistes par nom (autocomplétion / matching contributeur).
 *
 * @param name - Nom saisi (ex : par un contributeur lors d'une soumission).
 * @returns Jusqu'à 5 artistes candidats avec leurs métadonnées.
 */
export async function searchArtists(name: string) {
  const query = encodeURIComponent(name);
  return fetchJson(
    `${BASE}/artist?query=${query}&limit=5&fmt=json`,
    mbSearchResultSchema,
    { minIntervalMs: 1100 },
  );
}

/**
 * Détail complet d'un artiste : période d'activité, pays, genres et
 * relations utiles (membres, lien Wikidata pour l'enrichissement).
 *
 * @param mbid - Identifiant MusicBrainz (UUID) stocké dans external_refs.
 */
export async function getArtist(mbid: string) {
  return fetchJson<MbArtist>(
    `${BASE}/artist/${encodeURIComponent(mbid)}?inc=artist-relations+url-relations+tags+genres&fmt=json`,
    mbArtistSchema,
    { minIntervalMs: 1100 },
  );
}

/**
 * Extrait l'ID Wikidata des relations URL de l'artiste (permet ensuite
 * d'appeler `lib/providers/wikidata.ts` pour résumé + image).
 */
export function extractWikidataId(artist: MbArtist): string | null {
  const rel = artist.relations?.find(
    (r) => r.type === "wikidata" && r.url?.resource,
  );
  if (!rel?.url?.resource) return null;
  return rel.url.resource.split("/").pop() ?? null;
}

/**
 * Liste les membres (passés et présents) via les relations
 * "member of band" dirigées vers cet artiste.
 */
export function extractMembers(
  artist: MbArtist,
): { id: string; name: string }[] {
  return (artist.relations ?? [])
    .filter(
      (r) =>
        r.type === "member of band" && r.direction === "backward" && r.artist,
    )
    .map((r) => ({ id: r.artist!.id, name: r.artist!.name }));
}
