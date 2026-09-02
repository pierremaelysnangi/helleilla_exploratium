/**
 * Validation du profil public.
 *
 * Seul le nom affiché est modifiable par son propriétaire : le rôle passe
 * exclusivement par l'administration (`/api/users/:id`), et l'email relève
 * de Better Auth, qui gère sa vérification.
 */

import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Le nom affiché est requis")
    .max(100, "100 caractères maximum"),
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
