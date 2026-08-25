/**
 * Provider Deezer — extraits MP3 30 s et pochettes, sans authentification.
 * Alimente l'écoute d'aperçu dans l'app (lecteur maison) et fournit des
 * covers d'albums. Docs : https://developers.deezer.com/api
 */

// Client HTTP partagé (cache + retry)
import { fetchJson } from "./http";
import { z } from "zod";

const BASE = "https://api.deezer.com";

/** Piste Deezer : extrait 30 s (`preview`) + métadonnées d'affichage. */
const trackSchema = z.object({
  id: z.number(),
  title: z.string(),
  /** MP3 30 s hébergé par Deezer — lu directement par <audio>. */
  // Chaîne vide possible chez Deezer quand l'extrait n'existe pas :
  // ces pistes sont filtrées par searchTracks.
  preview: z.string(),
  duration: z.number().optional(),
  artist: z.object({ id: z.number(), name: z.string() }),
  album: z.object({
    id: z.number(),
    title: z.string(),
    cover_medium: z.string().url().nullish(),
  }),
});

export type DeezerTrack = z.infer<typeof trackSchema>;

/** Réponse de /search. */
const searchResponseSchema = z.object({
  data: z.array(trackSchema).default([]),
  total: z.number().default(0),
});

/**
 * Recherche de pistes par requête libre ("artiste titre").
 *
 * @param query - Terme de recherche (ex : "Emperor I am the black wizards").
 * @returns Jusqu'à 5 pistes avec leur preview MP3 30 s.
 */
export async function searchTracks(query: string): Promise<DeezerTrack[]> {
  const result = await fetchJson(
    `${BASE}/search?q=${encodeURIComponent(query)}&limit=5`,
    searchResponseSchema,
    { minIntervalMs: 300 },
  );
  // Seules les pistes ayant réellement un extrait sont exploitables
  return result.data.filter((t) => Boolean(t.preview));
}
