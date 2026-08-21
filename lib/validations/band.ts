import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const countryCodeRegex = /^[A-Z]{2}$/;

// Objet "nu", sans refine — réutilisable pour .partial()
const bandShape = {
  name: z
    .string()
    .trim()
    .min(1, "Le nom est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Le slug est requis")
    .max(200)
    .regex(slugRegex, "Le slug doit être en kebab-case (ex: my-band-name)"),

  bio: z
    .string()
    .trim()
    .max(5000, "La bio ne peut pas dépasser 5000 caractères")
    .optional()
    .nullable(),

  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(countryCodeRegex, "Code pays ISO 3166-1 alpha-2 requis (ex: FR, US)")
    .optional()
    .nullable(),

  formedYear: z.coerce
    .number()
    .int()
    .min(1900, "Année invalide")
    .max(CURRENT_YEAR, "L'année ne peut pas être dans le futur")
    .optional()
    .nullable(),

  dissolvedYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(CURRENT_YEAR)
    .optional()
    .nullable(),
};

const bandObject = z.object(bandShape);

function withYearRule<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data: any) =>
      !data.dissolvedYear ||
      !data.formedYear ||
      data.dissolvedYear >= data.formedYear,
    {
      message: "L'année de dissolution doit être postérieure à l'année de formation",
      path: ["dissolvedYear"],
    }
  );
}

// Fichier image optionnel — validé côté serveur dans la Server Action
export const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "Fichier vide")
  .refine((f) => f.size <= MAX_IMAGE_SIZE, "Image trop volumineuse (max 5 Mo)")
  .refine(
    (f) => ACCEPTED_IMAGE_TYPES.includes(f.type),
    "Format d'image non supporté (JPEG, PNG, WEBP uniquement)"
  )
  .optional();

export const createBandSchema = withYearRule(bandObject);

export const updateBandSchema = withYearRule(
  bandObject.partial().extend({
    id: z.string().uuid("ID de bande invalide"),
  })
);

export type CreateBandInput = z.infer<typeof createBandSchema>;
export type UpdateBandInput = z.infer<typeof updateBandSchema>;