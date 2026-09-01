/**
 * Route POST /api/contributions/:id/evidence — ajout de preuves par le
 * contributeur propriétaire du dossier, en réponse à une demande du
 * modérateur. Le dossier repasse en statut `pending`.
 *
 * Séparée du PATCH modérateur (`../route.ts`) : les deux transitions ont des
 * appelants, des permissions et des rate limits distincts.
 */

// Wrapper standard + réponses
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
// Validation des entrées (source unique)
import { addEvidenceSchema } from "@/lib/validations/contribution";
// Mutation workflow + lecture
import { addEvidence } from "@/db/mutations/contributions";
import { getContributionById } from "@/db/queries/contributions";

/**
 * POST /api/contributions/:id/evidence — ajout de preuves par l'auteur.
 *
 * Réservé au contributeur qui a soumis le dossier : la permission
 * `contribution:update` ne suffit pas, on vérifie aussi la propriété.
 *
 * @returns 200 avec le dossier remis en statut `pending`.
 */
export const POST = route(
  {
    params: idParamSchema,
    body: addEvidenceSchema,
    permission: { resource: "contribution", action: "update" },
    rateLimit: { limit: 20, window: 3600 },
  },
  async ({ params, body, session }) => {
    const contribution = await getContributionById(params.id);
    if (!contribution) return fail("NOT_FOUND", "Contribution introuvable");
    // Seul l'auteur du dossier peut le compléter
    if (contribution.submittedBy !== session!.user.id) {
      return fail("FORBIDDEN", "Seul l'auteur peut compléter ce dossier");
    }

    const updated = await addEvidence(params.id, body.evidence);
    return ok(updated);
  },
);
