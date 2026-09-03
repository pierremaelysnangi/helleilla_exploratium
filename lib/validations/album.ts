/**
 * Schémas de validation Zod pour les albums.
 * Définit les règles communes (forme de base), puis expose :
 * - `createAlbumSchema` : création complète
 * - `updateAlbumSchema` : mise à jour partielle avec `id` dans le body
 * - `updateAlbumBodySchema` : mise à jour partielle sans `id` (id via params d'URL)
 * et les types TypeScript inférés correspondants.
 */

// Bibliothèque de validation de schéma
import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear(); // Année courante, borne supérieure des dates
// Slug kebab-case : lettres minuscules/chiffres séparés par des tirets
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Types d'albums autorisés
const albumTypeEnum = z.enum([
  "album",
  "ep",
  "single",
  "compilation",
  "live",
  "demo",
  "split",
]);

// Forme de base réutilisable (sans refine), permettant les variantes .partial()
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

// Objet Zod construit à partir de la forme de base
const albumObject = z.object(albumShape);

/**
 * Schéma de création d'un album : tous les champs requis selon la forme de base.
 */
export const createAlbumSchema = albumObject;

/**
 * Schéma de mise à jour complète : champs partiels + `id` obligatoire dans le body.
 */
export const updateAlbumSchema = albumObject.partial().extend({
  id: z.string().uuid("ID d'album invalide"),
});

/**
 * Schéma du body de mise à jour sans `id` (l'id vient des params d'URL).
 */
// Pour les routes API : l'id vient des params, pas du body
export const updateAlbumBodySchema = albumObject.partial();

// Types TypeScript inférés depuis les schémas, utilisés côté app
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type UpdateAlbumBodyInput = z.infer<typeof updateAlbumBodySchema>;
