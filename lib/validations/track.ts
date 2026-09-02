/**
 * Schémas de validation Zod pour les pistes (tracks).
 * Définit la forme de base, puis expose :
 * - `createTrackSchema` : création complète
 * - `updateTrackSchema` : mise à jour avec `id` dans le body
 * - `updateTrackBodySchema` : mise à jour sans `id` (id via params d'URL)
 */

// Bibliothèque de validation de schéma
import { z } from "zod";

// Forme de base réutilisable pour les variantes .partial()
const trackShape = {
  albumId: z.string().uuid("ID d'album invalide"),

  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(300, "Le titre ne peut pas dépasser 300 caractères"),

  trackNumber: z.coerce
    .number()
    .int()
    .positive("Le numéro de piste doit être positif"),

  discNumber: z.coerce
    .number()
    .int()
    .min(1, "Le numéro de disque doit être >= 1")
    .default(1),

  durationMs: z.coerce
    .number()
    .int()
    .positive("La durée doit être positive (ms)")
    .optional()
    .nullable(),

  // URL externe (YouTube, Spotify, Bandcamp, etc.)
  audioUrl: z.string().url("URL invalide").optional().nullable(),
};

// Objet Zod construit à partir de la forme de base
const trackObject = z.object(trackShape);

/**
 * Schéma de création d'une piste : tous les champs de la forme de base.
 */
export const createTrackSchema = trackObject;

/**
 * Schéma de mise à jour complète : champs partiels + `id` obligatoire dans le body.
 */
export const updateTrackSchema = trackObject.partial().extend({
  id: z.string().uuid("ID de piste invalide"),
});

/**
 * Schéma du body de mise à jour sans `id` (l'id vient des params d'URL).
 */
export const updateTrackBodySchema = trackObject.partial();

// Types TypeScript inférés depuis les schémas, utilisés côté app
export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type UpdateTrackBodyInput = z.infer<typeof updateTrackBodySchema>;
