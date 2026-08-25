import { z } from "zod";

export const ErrorSchema = z
  .object({
    ok: z.literal(false),
    error: z.string().meta({ example: "Permission refusée." }),
    issues: z
      .array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        }),
      )
      .optional(),
  })
  .meta({ id: "Error" });

export function okSchema<T extends z.ZodType>(data: T) {
  return z.object({ ok: z.literal(true), data });
}

export const PaginationQuerySchema = z.object({
  q: z.string().optional().meta({ description: "Recherche plein-texte" }),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const PaginatedMetaSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const UuidParamSchema = z.object({
  id: z
    .string()
    .uuid()
    .meta({ example: "7b5e4850-93fd-48f0-bb37-cd67219015a1" }),
});

export const BandSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().meta({ example: "Necrofrost" }),
    slug: z.string().meta({ example: "necrofrost" }),
    country: z.string().nullable(),
    formedYear: z.number().int().nullable(),
    bio: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "Band" });

export const AlbumSchema = z
  .object({
    id: z.string().uuid(),
    bandId: z.string().uuid(),
    title: z.string().meta({ example: "Frozen Depths" }),
    slug: z.string(),
    releaseYear: z.number().int().nullable(),
    coverUrl: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "Album" });

export const TrackSchema = z
  .object({
    id: z.string().uuid(),
    albumId: z.string().uuid(),
    title: z.string().meta({ example: "Winterfall" }),
    position: z.number().int().nullable(),
    durationSec: z.number().int().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "Track" });

export const GenreSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().meta({ example: "Black Metal" }),
    slug: z.string(),
  })
  .meta({ id: "Genre" });
