/**
 * Schémas zod partagés par les routes API : paramètres d'URL, pagination,
 * recherche/tri et enveloppes de réponse (DTO band, listes paginées...).
 */

// Primitives de schéma zod
import { z } from "zod";

// Paramètre de route `{ id }` : UUID strict
export const idParamSchema = z.object({ id: z.uuid() });
// Paramètre de route `{ slug }` : chaîne non vide bornée
export const slugParamSchema = z.object({ slug: z.string().min(1).max(200) });
/**
 * Paramètres `{ bandSlug, albumSlug }` de l'adressage d'un album par slug.
 *
 * Un slug d'album n'est unique QUE dans son groupe (contrainte
 * `albums_band_slug_uq` sur `(band_id, slug)`) : il faut donc les deux
 * segments pour désigner un album sans ambiguïté.
 */
export const albumBySlugParamsSchema = z.object({
  bandSlug: z.string().min(1).max(200),
  albumSlug: z.string().min(1).max(200),
});

// Query de pagination standard, avec coercion des valeurs texte
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// Query de liste : pagination + recherche plein-texte + tri
export const listQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  sort: z.enum(["name", "createdAt", "year"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Recherche globale
 *
 * Alignés sur les documents réellement indexés dans Meilisearch par les
 * jobs BullMQ (`lib/queue/jobs/index-{band,album,track}.ts`) : toute
 * évolution des champs indexés doit être répercutée ici et inversement.
 */

// Query de GET /api/search : terme requis, nombre de résultats par index
export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

// Résultat "groupe" tel qu'indexé dans Meilisearch
export const bandHitSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().nullable(),
  countryCode: z.string().nullable(),
  formedYear: z.number().int().nullable(),
});

// Valeurs possibles du type de sortie (enum PostgreSQL album_type)
const ALBUM_TYPES = [
  "album",
  "ep",
  "single",
  "compilation",
  "live",
  "demo",
] as const;

// Résultat "album" tel qu'indexé dans Meilisearch
export const albumHitSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  bandId: z.uuid(),
  type: z.enum(ALBUM_TYPES),
  releaseDate: z.string().nullable(),
});

// Résultat "piste" tel qu'indexé dans Meilisearch
export const trackHitSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  albumId: z.uuid(),
  trackNumber: z.number().int(),
  durationMs: z.number().int().nullable(),
});

// Réponse groupée de la recherche globale : un tableau par index
export const globalSearchResponseSchema = z.object({
  bands: z.array(bandHitSchema),
  albums: z.array(albumHitSchema),
  tracks: z.array(trackHitSchema),
});

// Réponses

// DTO public d'un groupe tel que renvoyé par l'API
export const bandDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  country: z.string().nullable(),
  formedYear: z.number().nullable(),
  status: z.enum(["active", "split-up", "on-hold", "unknown"]),
  genres: z.array(
    z.object({ id: z.uuid(), name: z.string(), slug: z.string() }),
  ),
});

/** Enveloppe de liste paginée : `{ data: T[], meta: { total, page, ... } }`. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      perPage: z.number(),
      totalPages: z.number(),
    }),
  });

/** Enveloppe de réponse unitaire : `{ data: T }`. */
export const singleSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: item });
