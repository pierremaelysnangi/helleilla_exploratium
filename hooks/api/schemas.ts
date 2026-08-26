/**
 * Schémas zod des réponses API consommées côté client (hooks TanStack
 * Query). Miroir JSON des lignes Drizzle (`db/schema/*`) : les champs
 * `Date`/`timestamp` arrivent en chaînes ISO et les clés inconnues sont
 * ignorées par défaut (comportement non-strict de zod).
 * Toute évolution du schéma DB exposée via l'API doit être répercutée ici.
 */

// Validation de schéma côté client
import { z } from "zod";
// Enveloppe paginée partagée avec le serveur (source unique)
import { paginatedSchema } from "@/lib/api/schemas";

/** Ligne "band" sérialisée telle que renvoyée par GET /api/bands[/:id]. */
export const bandRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  formedYear: z.number().int().nullable().optional(),
  dissolvedYear: z.number().int().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Ligne "album" sérialisée telle que renvoyée par GET /api/albums[/:id]. */
export const albumRowSchema = z.object({
  id: z.uuid(),
  bandId: z.uuid(),
  title: z.string(),
  slug: z.string(),
  type: z.enum(["album", "ep", "single", "compilation", "live", "demo"]),
  releaseDate: z.string().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Ligne "track" sérialisée telle que renvoyée par GET /api/tracks[/:id]. */
export const trackRowSchema = z.object({
  id: z.uuid(),
  albumId: z.uuid(),
  title: z.string(),
  trackNumber: z.number().int(),
  discNumber: z.number().int(),
  durationMs: z.number().int().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Ligne "genre" sérialisée telle que renvoyée par GET /api/genres[/:id]. */
export const genreRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  parentId: z.uuid().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Réponse paginée standard `{ data: T[], meta: {...} }` déballée par apiJson. */
export function paginatedRows<T extends z.ZodTypeAny>(row: T) {
  return paginatedSchema(row);
}

// Types inférés utilisés par les hooks et les composants clients
export type BandRow = z.infer<typeof bandRowSchema>;
export type AlbumRow = z.infer<typeof albumRowSchema>;
export type TrackRow = z.infer<typeof trackRowSchema>;
export type GenreRow = z.infer<typeof genreRowSchema>;

/** Métadonnées de pagination jointes aux réponses de liste. */
export type PaginationMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/** Paramètres de filtre/tri d'une liste (query params des routes GET). */
export type ListParams = {
  page?: number;
  perPage?: number;
  q?: string;
};

/** Genre résumé projeté dans le détail groupe ({id,name,slug}). */
export const genreSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
});

/** Détail public d'un groupe : ligne + genres associés (GET by-slug / :id). */
export const bandDetailSchema = bandRowSchema.extend({
  genres: z.array(genreSummarySchema),
});

export type BandDetail = z.infer<typeof bandDetailSchema>;
export type GenreSummary = z.infer<typeof genreSummarySchema>;

/** DTO du resolver média (miroir de lib/media/resolver.ts). */
export const bandMediaSchema = z.object({
  band: z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    countryCode: z.string().nullish(),
    formedYear: z.number().nullish(),
    dissolvedYear: z.number().nullish(),
    bio: z.string().nullish(),
    imageUrl: z.string().nullish(),
  }),
  info: z.object({
    area: z.string().nullish(),
    lifeSpan: z
      .object({
        begin: z.string().nullish(),
        end: z.string().nullish(),
        ended: z.boolean().optional(),
      })
      .nullish(),
    members: z.array(z.object({ id: z.string(), name: z.string() })),
    genres: z.array(z.string()),
    wikidata: z
      .object({
        id: z.string(),
        extract: z.string().optional(),
        imageUrl: z.string().optional(),
      })
      .nullish(),
  }),
  images: z.array(z.object({ provider: z.string(), url: z.string() })),
  links: z.array(
    z.object({ provider: z.string(), label: z.string(), url: z.string() }),
  ),
  previews: z.array(
    z.object({
      title: z.string(),
      artistName: z.string(),
      previewUrl: z.string(),
      coverUrl: z.string().nullish(),
    }),
  ),
  degraded: z.boolean(),
});

export type BandMedia = z.infer<typeof bandMediaSchema>;
