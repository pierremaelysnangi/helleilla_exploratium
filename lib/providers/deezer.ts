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

/** Artiste Deezer : seuls le nom et les visuels nous intéressent. */
const artistSchema = z.object({
  id: z.number(),
  name: z.string(),
  picture_xl: z.string().nullish(),
  picture_big: z.string().nullish(),
});

const artistSearchSchema = z.object({
  data: z.array(artistSchema).default([]),
});

/** Album Deezer : titre et pochette. */
const albumSchema = z.object({
  id: z.number(),
  title: z.string(),
  cover_xl: z.string().nullish(),
  cover_big: z.string().nullish(),
});

const albumSearchSchema = z.object({
  data: z.array(albumSchema).default([]),
});

/**
 * Photo d'artiste Deezer — source de REPLI.
 *
 * Wikidata reste prioritaire : sa photo est encyclopédique et
 * librement licenciée. Deezer prend le relais pour les groupes qui n'ont
 * aucune déclaration P18, afin qu'aucune fiche ne se retrouve sans visuel.
 *
 * @param name - Nom exact du groupe.
 * @returns L'URL de la photo, ou `null` si aucun artiste ne correspond.
 */
export async function findArtistPicture(name: string): Promise<string | null> {
  try {
    const result = await fetchJson(
      `${BASE}/search/artist?q=${encodeURIComponent(name)}&limit=5`,
      artistSearchSchema,
      { minIntervalMs: 300 },
    );
    // Correspondance exacte du nom : « Emperor » ramène des homonymes,
    // et une photo erronée serait pire qu'un monogramme.
    const exact = result.data.find(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    );
    return exact?.picture_xl ?? exact?.picture_big ?? null;
  } catch {
    return null;
  }
}

/**
 * Pochette d'album Deezer — source de REPLI de Cover Art Archive.
 *
 * @param artist - Nom du groupe, pour lever les homonymies de titre.
 * @param title - Titre de l'album.
 */
export async function findAlbumCover(
  artist: string,
  title: string,
): Promise<string | null> {
  try {
    const result = await fetchJson(
      `${BASE}/search/album?q=${encodeURIComponent(`${artist} ${title}`)}&limit=5`,
      albumSearchSchema,
      { minIntervalMs: 300 },
    );
    const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
    const exact = result.data.find(
      (a) => normalize(a.title) === normalize(title),
    );
    return exact?.cover_xl ?? exact?.cover_big ?? null;
  } catch {
    return null;
  }
}
