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
const claimSchema = z.object({
  mainsnak: z.object({
    datavalue: z.object({ value: z.string() }).nullish(),
  }),
});

const entityImageSchema = z.object({
  entities: z.record(
    z.string(),
    z.object({
      claims: z
        .object({
          P18: z.array(claimSchema).nullish(),
          /** P154 : logo officiel, repli quand aucune photo n'existe. */
          P154: z.array(claimSchema).nullish(),
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
/**
 * Visuel Wikimedia Commons, avec son ADRESSE DE PROVENANCE.
 *
 * L'URL de l'image ne suffit pas : une photo de Commons est publiée sous
 * une licence libre qui exige d'en créditer l'auteur. Ce crédit vit sur
 * la page du fichier, pas dans le fichier — d'où `sourceUrl`, que
 * l'interface doit rendre atteignable en un clic.
 */
export type CommonsImage = {
  /** URL de l'image, dimensionnée. */
  url: string;
  /** Page Commons du fichier : auteur, licence, historique. */
  sourceUrl: string;
  /** Nom du fichier, tel que déclaré par Wikidata. */
  fileName: string;
};

async function claimFile(
  entityId: string,
  property: "P18" | "P154",
  width: number,
): Promise<CommonsImage | null> {
  try {
    const data = await fetchJson(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(entityId)}.json`,
      entityImageSchema,
    );
    const fileName =
      data.entities[entityId]?.claims?.[property]?.[0]?.mainsnak?.datavalue
        ?.value;
    if (!fileName) return null;

    const encoded = encodeURIComponent(fileName);
    return {
      url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`,
      sourceUrl: `https://commons.wikimedia.org/wiki/File:${encoded}`,
      fileName,
    };
  } catch {
    // Entité absente ou service indisponible : pas de visuel, pas d'erreur
    return null;
  }
}

export async function getEntityImage(
  entityId: string,
  width = 800,
): Promise<CommonsImage | null> {
  return claimFile(entityId, "P18", width);
}

/** URL seule de la photo — pour les appelants qui n'affichent pas de crédit. */
export async function getEntityImageUrl(
  entityId: string,
  width = 800,
): Promise<string | null> {
  return (await claimFile(entityId, "P18", width))?.url ?? null;
}

/**
 * Logo officiel d'une entité (propriété P154).
 *
 * Repli de P18 : un groupe sans photo de ses membres a souvent un logo,
 * et c'est le visuel qui l'identifie le mieux après une photo.
 */
export async function getEntityLogo(
  entityId: string,
  width = 800,
): Promise<CommonsImage | null> {
  return claimFile(entityId, "P154", width);
}

/** URL seule du logo. */
export async function getEntityLogoUrl(
  entityId: string,
  width = 800,
): Promise<string | null> {
  return (await claimFile(entityId, "P154", width))?.url ?? null;
}
