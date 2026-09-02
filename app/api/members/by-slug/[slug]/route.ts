/**
 * GET /api/members/by-slug/:slug — fiche publique d'un membre.
 *
 * Renvoie la personne, ses groupes (avec période) et les albums sur
 * lesquels elle figure : c'est ce qui rend une page membre autonome, là où
 * les données MusicBrainz éphémères ne donnaient qu'un nom.
 */

import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { slugParamSchema } from "@/lib/api/schemas";
import { getMemberBySlug } from "@/db/queries/members";

export const GET = route(
  { params: slugParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ params }) => {
    const member = await getMemberBySlug(params.slug);
    if (!member) return fail("NOT_FOUND", "Membre introuvable");
    return ok(member);
  },
);
