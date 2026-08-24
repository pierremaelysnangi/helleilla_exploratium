import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const albumTypeEnum = z.enum([
  "album",
  "ep",
  "single",
  "compilation",
  "live",
  "demo",
]);

const albumShape = {
  bandId: z.string().uuid("ID de groupe invalide"),

  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Le slug est requis")
    .max(200)
    .regex(slugRegex, "Le slug doit être en kebab-case (ex: my-album-title)"),

  type: albumTypeEnum.default("album"),

  releaseDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (format YYYY-MM-DD)")
    .optional()
    .nullable(),

  releaseYear: z.coerce
    .number()
    .int()
    .min(1900, "Année invalide")
    .max(CURRENT_YEAR + 1, "L'année ne peut pas être trop dans le futur")
    .optional()
    .nullable(),
};

const albumObject = z.object(albumShape);

export const createAlbumSchema = albumObject;

export const updateAlbumSchema = albumObject.partial().extend({
  id: z.string().uuid("ID d'album invalide"),
});

// Pour les routes API : l'id vient des params, pas du body
export const updateAlbumBodySchema = albumObject.partial();

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type UpdateAlbumBodyInput = z.infer<typeof updateAlbumBodySchema>;
