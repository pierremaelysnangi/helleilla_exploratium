/**
 * Provider Wikidata — résumé encyclopédique et image principale.
 * API REST publique sans clé. L'ID d'entité (ex : "Q494" pour Metallica)
 * provient en général des relations URL MusicBrainz (`extractWikidataId`).
 */

// Récupération JSON validée (cache + retry)
import { fetchJson } from "./http";
import { z } from "zod";

/** Contrat de l'API REST de résumé Wikidata. */
const summarySchema = z.object({
  /** Entité existante ? */
  type: z.string(),
  /** Titre de l'entité. */
  title: z.string(),
  /** Résumé encyclopédique court (premier paragraphe Wikipédia). */
  extract: z.string().optional(),
  thumbnail: z.object({ source: z.string().url() }).nullish(),
  /** Image originale, plus grande que la vignette. */
  originalimage: z.object({ source: z.string().url() }).nullish(),
});

export type WikidataSummary = z.infer<typeof summarySchema>;

/**
 * Récupère le résumé et l'image d'une entité Wikidata.
 *
 * @param entityId - ID d'entité ("Q494").
 * @returns Résumé + URLs d'image, ou null si l'entité n'existe pas (404).
 */
export async function getSummary(
  entityId: string,
): Promise<WikidataSummary | null> {
  try {
    return await fetchJson(
      `https://www.wikidata.org/api/rest_v1/page/summary/${encodeURIComponent(entityId)}`,
      summarySchema,
    );
  } catch (err: unknown) {
    // 404 : entité inconnue -> null (pas une erreur applicative)
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
