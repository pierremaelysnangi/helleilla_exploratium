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

/**
 * Contrat partiel de l'API EntityData : seule la propriété image (P18)
 * nous intéresse, le reste de l'entité est volumineux et inutile ici.
 */
const entityImageSchema = z.object({
  entities: z.record(
    z.string(),
    z.object({
      claims: z
        .object({
          P18: z
            .array(
              z.object({
                mainsnak: z.object({
                  datavalue: z.object({ value: z.string() }).nullish(),
                }),
              }),
            )
            .nullish(),
        })
        .nullish(),
    }),
  ),
});

/**
 * URL de l'image principale d'une entité Wikidata (propriété P18).
 *
 * L'endpoint `page/summary` utilisé par `getSummary` décrit la PAGE
 * Wikidata, pas le sujet : il ne porte jamais la photo du groupe. La
 * donnée vit dans la déclaration P18 de l'entité, sous forme d'un nom de
 * fichier Commons.
 *
 * On renvoie l'URL `Special:FilePath`, qui redirige toujours vers le
 * fichier courant, plutôt que l'adresse de stockage résolue : celle-ci
 * changerait si l'image était remplacée sur Commons.
 *
 * @param entityId - Identifiant d'entité (« Q160119 »).
 * @param width - Largeur souhaitée en pixels.
 * @returns L'URL de l'image, ou `null` si l'entité n'en déclare aucune.
 */
export async function getEntityImageUrl(
  entityId: string,
  width = 800,
): Promise<string | null> {
  try {
    const data = await fetchJson(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(entityId)}.json`,
      entityImageSchema,
    );
    const fileName =
      data.entities[entityId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!fileName) return null;
    return (
      "https://commons.wikimedia.org/wiki/Special:FilePath/" +
      `${encodeURIComponent(fileName)}?width=${width}`
    );
  } catch {
    // Entité absente ou service indisponible : pas de visuel, pas d'erreur
    return null;
  }
}
