/**
 * PUT /api/bands/:id/genres — remplace la liste des genres d'un groupe.
 * Sémantique "sync" idempotente (PUT) : l'ensemble fourni devient
 * l'unique vérité ; une liste vide détache tous les genres.
 */

// Wrapper standard : validation + permission RBAC + rate limit
import { route } from "@/lib/api/handler";
// Réponse standard + 404 typé
import { ok, fail } from "@/lib/api/response";
// Paramètre de route UUID validé par le pipeline
import { idParamSchema } from "@/lib/api/schemas";
// Corps : liste d'UUIDs de genres (max 20)
import { setBandGenresSchema } from "@/lib/validations/genre";
// Mutation transactionnelle delete+insert sur bandGenres
import { setBandGenres } from "@/db/mutations/bands";
// Vérification d'existence du groupe avant écriture
import { getBandById } from "@/db/queries/bands";

/**
 * PUT /api/bands/:id/genres — sync complète des genres du groupe.
 *
 * Réservé aux utilisateurs ayant la permission `band:update`
 * (contributor et au-delà). Rate limit strict (10/min, failMode closed).
 * Les genreIds inconnus déclenchent une violation FK convertie en 422.
 *
 * @returns 200 avec `{ bandId, genreIds }` après synchronisation,
 *   ou 404 si le groupe n'existe pas.
 */
export const PUT = route(
  {
    params: idParamSchema,
    body: setBandGenresSchema,
    permission: { resource: "band", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    const band = await getBandById(params.id);
    if (!band) return fail("NOT_FOUND", "Groupe introuvable");

    await setBandGenres(params.id, body.genreIds);
    return ok({ bandId: params.id, genreIds: body.genreIds });
  },
);
