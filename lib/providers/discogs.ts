/**
 * Provider Discogs — photos, bio et crédits d'artistes.
 * Nécessite un token personnel (env DISCOGS_TOKEN, optionnel) : sans
 * token, toutes les fonctions retournent null (dégradation propre,
 * jamais de crash) et aucun appel n'est émis.
 * Docs : https://www.discogs.com/developers
 */

// Client HTTP partagé (cache + retry + throttle)
import { fetchJson } from "./http";
// Token optionnel validé au boot
import { env } from "@/lib/env";
import { z } from "zod";

const BASE = "https://api.discogs.com";

/** Résultat de recherche artiste. */
const searchResultSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        title: z.string(),
        thumb: z.string().url().nullable().optional(),
        cover_image: z.string().url().nullable().optional(),
      }),
    )
    .default([]),
});

export type DiscogsSearchResult = z.infer<typeof searchResultSchema>;

/** Détail d'un artiste : bio (`profile`) et variations de nom. */
const artistSchema = z.object({
  id: z.number(),
  name: z.string(),
  profile: z.string().nullish(),
  namevariations: z.array(z.string()).default([]),
  urls: z.array(z.string()).default([]),
});

export type DiscogsArtist = z.infer<typeof artistSchema>;

/** Indique si le provider est utilisable (token configuré). */
export function isDiscogsEnabled(): boolean {
  return Boolean(env.DISCOGS_TOKEN);
}

/** En-têtes d'authentification Discogs ; throttle ~1 req/s par courtoisie. */
function authHeaders(): Record<string, string> {
  return {
    Authorization: `Discogs token=${env.DISCOGS_TOKEN}`,
    // Discogs exige un User-Agent applicatif explicite
    "Accept-Encoding": "identity",
  };
}

/**
 * Recherche d'artistes par nom.
 * @returns Résultats avec vignettes, ou null si le token est absent.
 */
export async function searchArtists(
  name: string,
): Promise<DiscogsSearchResult | null> {
  if (!isDiscogsEnabled()) return null;
  const query = encodeURIComponent(name);
  return fetchJson(
    `${BASE}/database/search?type=artist&q=${query}&per_page=3`,
    searchResultSchema,
    { headers: authHeaders(), minIntervalMs: 1000 },
  );
}

/**
 * Détail d'un artiste Discogs (bio, variations, sites officiels).
 * @returns L'artiste, ou null si token absent / introuvable (404).
 */
export async function getArtist(
  discogsId: number,
): Promise<DiscogsArtist | null> {
  if (!isDiscogsEnabled()) return null;
  try {
    return await fetchJson(`${BASE}/artists/${discogsId}`, artistSchema, {
      headers: authHeaders(),
      minIntervalMs: 1000,
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "status" in err &&
      (err as { status?: number }).status === 404
    ) {
      return null;
    }
    throw err;
  }
}
