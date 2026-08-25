/**
 * Schémas de validation Zod pour les genres musicaux.
 * Expose les schémas de création et de mise à jour (avec hiérarchie
 * optionnelle via parentId) ainsi que leur usage typé.
 */

// Bibliothèque de validation de schéma
import { z } from "zod";

/**
 * Schéma de création d'un genre : nom, slug kebab-case simple,
 * et parent optionnel (genre hiérarchique).
 */
export const createGenreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  parentId: z.string().uuid().nullable().optional(),
});

/**
 * Schéma de mise à jour complète : champs partiels + `id` obligatoire.
 * Utilisé par la Server Action de mise à jour (le formulaire porte l'id).
 */
export const updateGenreSchema = createGenreSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Schéma du corps PATCH de la route /api/genres/:id : champs partiels
 * SANS id (l'identifiant vient des paramètres d'URL). Miroir de
 * `updateBandBodySchema` pour les groupes.
 */
export const updateGenreBodySchema = createGenreSchema.partial();

/**
 * Corps du PUT /api/bands/:id/genres : remplacement complet de la
 * liste de genres d'un groupe (sync idempotente). Borne haute de 20
 * genres pour éviter les payloads absurdes.
 */
export const setBandGenresSchema = z.object({
  genreIds: z.array(z.string().uuid()).max(20),
});
