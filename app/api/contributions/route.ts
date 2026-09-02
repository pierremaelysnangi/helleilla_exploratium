/**
 * Routes /api/contributions — workflow de contribution modérée.
 * POST  : soumission d'un dossier (contributor+) avec preuves
 *         obligatoires, puis génération d'URLs d'upload MinIO staging.
 * GET   : file de modération (moderator+, tous statuts ouverts) ou
         les contributions du contributeur courant.
 */

// Wrapper standard : validation + RBAC + rate limit
import { route } from "@/lib/api/handler";
// Matrice RBAC : la règle d'accès vit là, pas dans un test de chaîne
import { can } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/rbac/roles";
import { ok, fail } from "@/lib/api/response";
// Validation des dossiers et preuves (source unique)
import { createContributionSchema } from "@/lib/validations/contribution";
import { z } from "zod";
// Mutations + lecture staging MinIO
import { createContribution } from "@/db/mutations/contributions";
import {
  listContributionsForReview,
  listContributionsByUser,
} from "@/db/queries/contributions";
import {
  presignContributionUpload,
  type ContributionMediaType,
} from "@/lib/storage/contributions";

/** Query de la liste : filtre statut optionnel (usage modérateur). */
const listQuerySchema = z.object({
  scope: z.enum(["mine", "review"]).default("mine"),
  status: z
    .enum(["pending", "evidence_requested", "approved", "expired", "rejected"])
    .optional(),
});

/**
 * POST /api/contributions — crée un dossier de contribution.
 *
 * Réservé aux contributeurs+ (`contribution:create`). Le dossier exige
 * au moins deux preuves dont une référence officielle vérifiable
 * (barrière anti-contenu-IA). Réponse inclut des URLs PUT présignées
 * vers l'espace STAGING privé pour joindre photos/audio.
 *
 * @returns 201 `{ contribution, uploads: [{ contentType, uploadUrl }] }`.
 */
export const POST = route(
  {
    body: createContributionSchema,
    permission: { resource: "contribution", action: "create" },
    rateLimit: { limit: 5, window: 3600, failMode: "closed" }, // 5/h max
    auth: true, // session obligatoire même au-delà de la permission
  },
  async ({ body, session }) => {
    const contribution = await createContribution({
      type: body.type,
      payload: {
        ...body.payload,
        // targetBandId vit dans le payload JSONB (pas de colonne dédiée)
        targetBandId: body.targetBandId ?? null,
      },
      evidence: body.evidence,
      submittedBy: session!.user.id,
    });

    // URLs présignées proposées pour chaque type de média courant :
    // le client choisit ce qu'il veut joindre (photos, extraits audio)
    const mediaTypes: ContributionMediaType[] = [
      "image/jpeg",
      "image/webp",
      "audio/mpeg",
    ];
    const uploads = await Promise.all(
      mediaTypes.map(async (contentType) => ({
        contentType,
        ...(await presignContributionUpload(contribution.id, contentType)),
      })),
    );

    return ok({ contribution, uploads }, { status: 201 });
  },
);

/**
 * GET /api/contributions?scope=mine|review[&status=...]
 *
 * - `scope=mine` (défaut) : les contributions de l'appelant ;
 * - `scope=review` : la file complète, réservé moderator+
 *   (`contribution:moderate`).
 */
export const GET = route(
  { query: listQuerySchema, auth: true },
  async ({ query, session }) => {
    if (query.scope === "review") {
      // Permission vérifiée ici et non dans la config de route : `scope=mine`
      // reste ouvert à tout utilisateur connecté. On interroge la MATRICE
      // plutôt qu'une liste de rôles en dur, sans quoi ajouter un rôle
      // obligerait à retrouver chaque test disséminé dans les routes.
      const role = (session!.user.role ?? "user") as Role;
      if (!can(role, "contribution", "moderate")) {
        return fail("FORBIDDEN", "File de modération réservée aux modérateurs");
      }
      return ok(await listContributionsForReview(query.status));
    }
    return ok(await listContributionsByUser(session!.user.id));
  },
);
