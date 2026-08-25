/**
 * Schémas de validation Zod pour les groupes (bands).
 * Définit la forme de base réutilisable, une règle métier sur les années
 * (dissolution >= formation), la validation d'un fichier image optionnel,
 * et expose les schémas de création/mise à jour + types inférés.
 */

// Bibliothèque de validation de schéma
import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear(); // Année courante, borne supérieure

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // Taille max d'image : 5 Mo
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]; // Formats acceptés

// Slug kebab-case : lettres minuscules/chiffres séparés par des tirets
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Code pays ISO 3166-1 alpha-2 (ex: FR, US)
const countryCodeRegex = /^[A-Z]{2}$/;

// Objet "nu", sans refine — réutilisable pour .partial()
// Forme de base sans règle transversale, pour pouvoir appliquer .partial()
export const bandShape = {
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

// Objet Zod construit à partir de la forme de base
const bandObject = z.object(bandShape);

// Contrainte des champs années (utilisée pour typer le refine)
type YearFields = {
  formedYear?: number | null;
  dissolvedYear?: number | null;
};

/**
 * Ajoute une règle métier à un schéma : l'année de dissolution, si fournie,
 * doit être postérieure ou égale à l'année de formation.
 * @param schema Un schéma Zod dont la sortie contient formedYear/dissolvedYear.
 * @returns Le schéma enrichi du refine.
 */
export function withYearRule<T extends z.ZodType<YearFields>>(schema: T) {
  return schema.refine(
    (data) =>
      !data.dissolvedYear ||
      !data.formedYear ||
      data.dissolvedYear >= data.formedYear,
    {
      message:
        "L'année de dissolution doit être postérieure à l'année de formation",
      path: ["dissolvedYear"],
    },
  );
}

/* 
function withYearRule<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data: z.output<T> & YearFields) =>
      data.dissolvedYear 
      data.formedYear 
      data.dissolvedYear >= data.formedYear,
    { message: "…", path: ["dissolvedYear"] },
  );
}
*/

/**
 * Validation d'un fichier image optionnel (présence, taille max 5 Mo, format).
 * Utilisé côté serveur dans les Server Actions.
 */
// Fichier image optionnel — validé côté serveur dans la Server Action
export const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "Fichier vide")
  .refine((f) => f.size <= MAX_IMAGE_SIZE, "Image trop volumineuse (max 5 Mo)")
  .refine(
    (f) => ACCEPTED_IMAGE_TYPES.includes(f.type),
    "Format d'image non supporté (JPEG, PNG, WEBP uniquement)",
  )
  .optional();

/**
 * Schéma de création d'un groupe : forme de base + règle sur les années.
 */
export const createBandSchema = withYearRule(bandObject);

/**
 * Schéma du body de mise à jour sans `id` : champs partiels + règle années.
 */
export const updateBandBodySchema = withYearRule(bandObject.partial());

/**
 * Schéma de mise à jour complète : champs partiels + `id` obligatoire + règle années.
 */
export const updateBandSchema = withYearRule(
  bandObject.partial().extend({
    id: z.string().uuid("ID de bande invalide"),
  }),
);

// Types TypeScript inférés depuis les schémas, utilisés côté app
export type CreateBandInput = z.infer<typeof createBandSchema>;
export type UpdateBandInput = z.infer<typeof updateBandSchema>;
