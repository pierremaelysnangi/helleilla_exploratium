/**
 * Routes /api/contributions/:id — transitions du workflow de médiation.
 * POST /:id/evidence : le contributeur ajoute des preuves (retour en
 *   `pending`).
 * PATCH /:id : le modérateur applique une transition
 *   (evidence_requested | approved | rejected-admin uniquement) ;
 *   l'approbation promeut les médias staging vers l'espace public.
 */

// Wrapper standard + réponses + erreur typée
import { route } from "@/lib/api/handler";
import { ok, fail, ApiError } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
// Validation des entrées (source unique)
import {
  addEvidenceSchema,
  requestEvidenceSchema,
} from "@/lib/validations/contribution";
import { z } from "zod";
// Mutations workflow + lecture
import {
  requestEvidence,
  addEvidence,
  updateStatus,
} from "@/db/mutations/contributions";
import { getContributionById } from "@/db/queries/contributions";
// Promotion des médias MinIO à l'approbation
import { promoteContributionFiles } from "@/lib/storage/contributions";

/** Contexte de route partagé : paramètre { id }. */
const paramsConfig = { params: idParamSchema };

/**
 * POST /api/contributions/:id/evidence — ajout de preuves par le
 * contributeur propriétaire. Retourne le dossier en statut `pending`.
 */
export const POST = route(
  {
    ...paramsConfig,
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

/** Corps du PATCH modérateur : union discriminée par `status`. */
const patchBodySchema = z.discriminatedUnion("status", [
  requestEvidenceSchema.extend({ status: z.literal("evidence_requested") }),
  z.object({ status: z.literal("approved") }),
  z.object({ status: z.literal("rejected") }),
]);

/**
 * PATCH /api/contributions/:id — transition modérateur :
 * - `evidence_requested` : demande de preuves (+ relance, échéance) ;
 * - `approved` : validation — promotion MinIO staging -> public ;
 * - `rejected` : rejet TERMINAL réservé aux admins.
 */
export const PATCH = route(
  {
    ...paramsConfig,
    body: patchBodySchema,
    permission: { resource: "contribution", action: "moderate" },
    rateLimit: { limit: 30, window: 60, failMode: "closed" },
  },
  async ({ params, body, session }) => {
    const contribution = await getContributionById(params.id);
    if (!contribution) return fail("NOT_FOUND", "Contribution introuvable");

    // --- Demande de preuves ---
    if (body.status === "evidence_requested") {
      const updated = await requestEvidence(
        params.id,
        session!.user.id,
        body.reviewNotes,
      );
      return ok(updated);
    }

    // --- Rejet terminal : admin uniquement ---
    if (body.status === "rejected") {
      const role = session!.user.role ?? "user";
      if (role !== "admin") {
        return fail(
          "FORBIDDEN",
          "Le rejet terminal est réservé aux administrateurs (demandez des preuves)",
        );
      }
      return ok(await updateStatus(params.id, "rejected", session!.user.id));
    }

    // --- Approbation : promotion transactionnelle des médias ---
    const contributionPayload = contribution.payload as {
      targetBandId?: string | null;
    };
    if (
      contribution.type !== "band_create" ||
      !contributionPayload.targetBandId
    ) {
      // Sans bande cible connue (band_update), pas de promotion média
      return ok(await updateStatus(params.id, "approved", session!.user.id));
    }

    try {
      await promoteContributionFiles(
        params.id,
        String(contributionPayload.targetBandId),
      );
    } catch (err) {
      console.error("[contributions] Promotion MinIO échouée:", err);
      throw new ApiError(
        "UNAVAILABLE",
        "Stockage indisponible : approbation non finalisée, réessayez",
      );
    }
    return ok(await updateStatus(params.id, "approved", session!.user.id));
  },
);
