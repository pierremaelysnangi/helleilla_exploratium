import { z } from "zod";

export const createGenreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateGenreSchema = createGenreSchema.partial().extend({
  id: z.string().uuid(),
});