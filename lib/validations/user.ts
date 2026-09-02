/**
 * Validation zod de l'administration des comptes.
 *
 * Le rôle est le seul champ réellement sensible : Better Auth interdit au
 * client de se l'attribuer lui-même (`input: false` dans lib/auth.ts),
 * l'unique voie de changement est donc cette route, réservée aux admins.
 */

import { z } from "zod";

/** Rôles de la hiérarchie RBAC (enum PostgreSQL `user_role`). */
export const userRoleSchema = z.enum([
  "user",
  "contributor",
  "moderator",
  "admin",
]);

export type UserRoleInput = z.infer<typeof userRoleSchema>;

/** Query de la liste d'administration : pagination + recherche + rôle. */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  role: userRoleSchema.optional(),
});

/**
 * Corps du PATCH d'administration.
 *
 * `.refine` sur la présence d'au moins un champ : un PATCH vide serait
 * accepté silencieusement et donnerait l'illusion d'une modification.
 */
export const updateUserSchema = z
  .object({
    role: userRoleSchema.optional(),
    banned: z.boolean().optional(),
    banReason: z.string().trim().max(500).nullish(),
  })
  .refine(
    (data) =>
      data.role !== undefined ||
      data.banned !== undefined ||
      data.banReason !== undefined,
    { message: "Aucune modification demandée" },
  );

export type UpdateUserInput = z.input<typeof updateUserSchema>;
