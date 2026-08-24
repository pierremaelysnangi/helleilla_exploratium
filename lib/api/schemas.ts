import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid() });
export const slugParamSchema = z.object({ slug: z.string().min(1).max(200) });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  sort: z.enum(["name", "createdAt", "year"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Réponses
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

export const singleSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: item });
