/**
 * Validation des membres et des formations.
 */

import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENT_YEAR = new Date().getFullYear();

/** Année plausible pour une carrière musicale. */
const careerYear = z.coerce.number().int().min(1900).max(CURRENT_YEAR);

export const createMemberSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(200)
    .regex(slugRegex, "Le slug doit être en kebab-case"),
  bio: z.string().trim().max(5000).optional().nullable(),
  musicbrainzId: z.string().trim().max(100).optional().nullable(),
});

/** Une ligne de formation soumise dans la sync d'un groupe. */
export const bandMembershipSchema = z
  .object({
    memberId: z.string().uuid(),
    role: z.string().trim().max(100).optional().nullable(),
    joinedYear: careerYear.optional().nullable(),
    leftYear: careerYear.optional().nullable(),
  })
  .refine((m) => !m.leftYear || !m.joinedYear || m.leftYear >= m.joinedYear, {
    message: "L'année de départ doit être postérieure à l'arrivée",
    path: ["leftYear"],
  });

/** Corps du PUT /api/bands/:id/members : état complet de la formation. */
export const setBandMembersSchema = z.object({
  members: z.array(bandMembershipSchema).max(50),
});

export type CreateMemberInput = z.input<typeof createMemberSchema>;
export type SetBandMembersInput = z.input<typeof setBandMembersSchema>;
