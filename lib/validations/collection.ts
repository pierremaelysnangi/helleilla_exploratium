/**
 * Validation des notes et des listes personnelles.
 */

import { z } from "zod";

/**
 * Échelle de notation : 1 à 5, entiers.
 *
 * Bornée aussi en base par une contrainte CHECK — une échelle validée
 * uniquement côté application se contourne dès qu'une écriture passe
 * ailleurs.
 */
export const ratingScoreSchema = z.coerce.number().int().min(1).max(5);

export const setRatingSchema = z.object({ score: ratingScoreSchema });

/** Statuts de la liste personnelle. */
export const collectionStatusSchema = z.enum(["owned", "wanted"]);

export const setCollectionSchema = z.object({
  albumId: z.string().uuid(),
  status: collectionStatusSchema,
});

export type CollectionStatus = z.infer<typeof collectionStatusSchema>;
