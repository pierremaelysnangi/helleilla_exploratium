/**
 * Validation des avis de forum.
 *
 * Un avis porte sur un groupe OU un album : le schéma refuse aussi bien
 * l'absence de sujet que la présence des deux, en écho à la contrainte
 * `forum_posts_one_subject` en base. Valider des deux côtés n'est pas
 * une redondance : le schéma zod produit un message exploitable par le
 * formulaire, la contrainte SQL tient face à une écriture qui passerait
 * ailleurs.
 */

import { z } from "zod";
import {
  FORUM_POST_MIN_LENGTH,
  FORUM_POST_MAX_LENGTH,
} from "@/db/schema/forum";

/** Corps d'un avis, bornes alignées sur la contrainte en base. */
export const forumBodySchema = z
  .string()
  .trim()
  .min(FORUM_POST_MIN_LENGTH)
  .max(FORUM_POST_MAX_LENGTH);

/**
 * Création d'un avis.
 *
 * `superRefine` plutôt qu'une union : l'union aurait rendu deux erreurs
 * concurrentes sur un formulaire qui n'a qu'un seul champ « sujet ».
 */
export const createForumPostSchema = z
  .object({
    bandId: z.string().uuid().optional(),
    albumId: z.string().uuid().optional(),
    body: forumBodySchema,
  })
  .superRefine((value, ctx) => {
    const subjects = [value.bandId, value.albumId].filter(Boolean).length;
    if (subjects !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["bandId"],
        message:
          "Un avis porte sur un groupe ou un album, et sur un seul des deux.",
      });
    }
  });

/**
 * Filtres de la liste : un sujet facultatif.
 *
 * Sans filtre, la route renvoie le fil général — c'est ce que lisent la
 * page Forums et l'accueil.
 */
export const forumListQuerySchema = z.object({
  bandId: z.string().uuid().optional(),
  albumId: z.string().uuid().optional(),
});

export type CreateForumPostInput = z.infer<typeof createForumPostSchema>;
