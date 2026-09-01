/**
 * Route PATCH /api/contributions/:id — transitions du workflow de médiation
 * appliquées par le modérateur (evidence_requested | approved | rejected,
 * ce dernier réservé aux admins). L'approbation matérialise le dossier :
 * création ou enrichissement du groupe, références externes et promotion
 * des médias (voir lib/contributions/approve.ts).
 *
 * L'ajout de preuves par le contributeur vit dans `./evidence/route.ts`.
 */

// Wrapper standard + réponses
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
// Validation des entrées (source unique)
import { requestEvidenceSchema } from "@/lib/validations/contribution";
import { z } from "zod";
// Mutations workflow + lecture
import { requestEvidence, updateStatus } from "@/db/mutations/contributions";
import { getContributionById } from "@/db/queries/contributions";
// Approbation : création/enrichissement du groupe, refs et médias
import { approveContribution } from "@/lib/contributions/approve";

/** Contexte de route partagé : paramètre { id }. */
const paramsConfig = { params: idParamSchema };

/** Corps du PATCH modérateur : union discriminée par `status`. */
const patchBodySchema = z.discriminatedUnion("status", [
  requestEvidenceSchema.extend({ status: z.literal("evidence_requested") }),
  z.object({ status: z.literal("approved") }),
  z.object({ status: z.literal("rejected") }),
]);

/**
 * PATCH /api/contributions/:id — transition modérateur :
 * - `evidence_requested` : demande de preuves (+ relance, échéance) ;
 * - `approved` : groupe créé/enrichi, refs synchronisées, médias promus ;
 * - `rejected` : rejet TERMINAL réservé aux admins.
 *
 * @returns Le dossier mis à jour ; l'approbation joint `bandId`.
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

    // --- Approbation : matérialise le groupe, les références et les médias ---
    const { contribution: approved, bandId } = await approveContribution(
      contribution,
      session!.user.id,
    );
    return ok({ ...approved, bandId });
  },
);
