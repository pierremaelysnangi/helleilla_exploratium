"use client";

/**
 * Hooks TanStack Query du workflow de contribution (/api/contributions).
 *
 * Volontairement écrits à la main plutôt que dérivés de `createEntityHooks` :
 * la ressource n'est pas un CRUD paginé. Elle expose deux vues distinctes
 * selon le rôle (« mes dossiers » / file de relecture), une liste non
 * paginée, et des transitions métier — ajout de preuves, demande de
 * preuves, approbation, rejet — qui ne se ramènent pas à un PATCH générique.
 *
 * Aucune Server Action n'est ajoutée en doublon : les routes API portent
 * déjà tout le contrat, sont documentées dans l'OpenAPI et testées.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
// Client HTTP navigateur + erreur typée
import { apiJson, type ApiClientError } from "./api/client";
// Clés de cache centralisées
import { contributionKeys } from "./api/queryKeys";
// Contrats de réponse
import {
  contributionRowSchema,
  type ContributionRow,
  type ContributionStatus,
} from "./api/schemas";
// Contrats d'écriture partagés avec le serveur (source unique)
import {
  createContributionSchema,
  addEvidenceSchema,
  type CreateContributionInput,
  type EvidenceItem,
} from "@/lib/validations/contribution";

/** La route renvoie une liste nue (pas d'enveloppe paginée). */
const contributionListSchema = z.array(contributionRowSchema);

/** Réponse de POST /api/contributions : dossier + URLs d'upload staging. */
const createdContributionSchema = z.object({
  contribution: contributionRowSchema,
  uploads: z.array(
    z.object({
      contentType: z.string(),
      uploadUrl: z.string(),
      fileKey: z.string(),
    }),
  ),
});

export type CreatedContribution = z.infer<typeof createdContributionSchema>;

/** Options de requête des dossiers de l'utilisateur courant. */
export function myContributionsOptions() {
  return queryOptions({
    queryKey: contributionKeys.mine(),
    queryFn: async ({ signal }): Promise<ContributionRow[]> => {
      const data = await apiJson<unknown>("/api/contributions", {
        query: { scope: "mine" },
        signal,
      });
      return contributionListSchema.parse(data);
    },
  });
}

/** Dossiers soumis par l'utilisateur courant, tous statuts confondus. */
export function useMyContributions() {
  return useQuery(myContributionsOptions());
}

/**
 * Options de requête de la file de modération (moderator+).
 * @param status - Filtre de statut ; sans valeur, les statuts ouverts.
 */
export function reviewQueueOptions(status?: ContributionStatus) {
  return queryOptions({
    queryKey: contributionKeys.review(status),
    queryFn: async ({ signal }): Promise<ContributionRow[]> => {
      const data = await apiJson<unknown>("/api/contributions", {
        query: { scope: "review", status },
        signal,
      });
      return contributionListSchema.parse(data);
    },
  });
}

/** File de relecture, réservée aux modérateurs et administrateurs. */
export function useReviewQueue(status?: ContributionStatus) {
  return useQuery(reviewQueueOptions(status));
}

/**
 * Soumission d'un dossier (contributor+).
 *
 * Le corps est validé côté client AVANT envoi avec le schéma serveur :
 * l'utilisateur voit immédiatement qu'il manque une preuve officielle,
 * sans consommer l'un de ses 5 envois horaires.
 */
export function useCreateContribution() {
  const qc = useQueryClient();
  return useMutation<
    CreatedContribution,
    ApiClientError,
    CreateContributionInput
  >({
    mutationFn: async (input) => {
      const body = createContributionSchema.parse(input);
      const data = await apiJson<unknown>("/api/contributions", {
        method: "POST",
        body,
      });
      return createdContributionSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
}

/** Ajout de preuves par l'auteur du dossier, après une demande. */
export function useAddEvidence() {
  const qc = useQueryClient();
  return useMutation<
    ContributionRow,
    ApiClientError,
    { id: string; evidence: EvidenceItem[] }
  >({
    mutationFn: async ({ id, evidence }) => {
      const body = addEvidenceSchema.parse({ evidence });
      const data = await apiJson<unknown>(
        `/api/contributions/${encodeURIComponent(id)}/evidence`,
        { method: "POST", body },
      );
      return contributionRowSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
}

/** Transition appliquée par un modérateur (ou un admin pour le rejet). */
export type ReviewTransition =
  | { id: string; status: "evidence_requested"; reviewNotes: string }
  | { id: string; status: "approved" }
  | { id: string; status: "rejected" };

/**
 * Transition de relecture : demande de preuves, approbation ou rejet.
 *
 * L'approbation renvoie en plus le `bandId` du groupe matérialisé, ce qui
 * permet de renvoyer le modérateur directement vers la fiche créée.
 */
export function useReviewContribution() {
  const qc = useQueryClient();
  return useMutation<
    ContributionRow & { bandId?: string },
    ApiClientError,
    ReviewTransition
  >({
    mutationFn: async ({ id, ...body }) => {
      const data = await apiJson<unknown>(
        `/api/contributions/${encodeURIComponent(id)}`,
        { method: "PATCH", body },
      );
      // `bandId` n'accompagne que l'approbation : on le laisse passer sans
      // l'imposer au schéma de ligne.
      return contributionRowSchema
        .extend({ bandId: z.string().optional() })
        .parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
}
