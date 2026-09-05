/**
 * Hooks TanStack Query pour les groupes (/api/bands).
 * Instancie la fabrique générique avec les schémas de ligne (client) et
 * de validation (corps POST/PATCH), puis ré-exporte des hooks nommés.
 */

// Fabrique générique d'hooks CRUD
import { createEntityHooks } from "./api/entity";
// Clés de requête de l'entité
import { bandKeys } from "./api/queryKeys";
// Schéma de ligne sérialisée (validation runtime des réponses)
import { bandRowSchema } from "./api/schemas";
// Schémas des corps de mutation (source unique côté serveur)
import { createBandSchema, updateBandBodySchema } from "@/lib/validations/band";

/** Jeu d'hooks configuré pour les groupes. */
const bandsHooks = createEntityHooks({
  basePath: "/api/bands",
  keys: bandKeys,
  rowSchema: bandRowSchema,
  createSchema: createBandSchema,
  updateSchema: updateBandBodySchema,
});

/** Options de requête de la liste paginée (préfetch RSC possible). */
export const bandsListOptions = bandsHooks.listQueryOptions;
/** Options de requête du détail. */
export const bandDetailOptions = bandsHooks.detailQueryOptions;
/** Liste paginée de groupes. */
export const useBands = bandsHooks.useList;
/** Détail d'un groupe par id. */
export const useBand = bandsHooks.useDetail;
/** Création d'un groupe (contributor+). */
export const useCreateBand = bandsHooks.useCreate;
/** Mise à jour partielle d'un groupe (contributor+). */
export const useUpdateBand = bandsHooks.useUpdate;
/** Suppression d'un groupe (moderator+). */
export const useDeleteBand = bandsHooks.useDelete;

// Lecture publique par slug (pages détail SSR)
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiJson } from "./api/client";
import { setBandGenresSchema } from "@/lib/validations/genre";
// Fetch RSC partagé : déballe { data } et distingue 404 de panne
import { fetchPublicOrNull } from "@/lib/api/client";
import { bandDetailSchema, type BandDetail } from "./api/schemas";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Options de requête du détail par slug (GET /api/bands/by-slug/:slug).
 * Exposées pour un fetch RSC direct côté page serveur.
 */
export function bandBySlugOptions(slug: string) {
  return queryOptions({
    queryKey: ["bands", "by-slug", slug],
    queryFn: async ({ signal }): Promise<BandDetail> => {
      const data = await apiJson<unknown>(
        `/api/bands/by-slug/${encodeURIComponent(slug)}`,
        { signal },
      );
      return bandDetailSchema.parse(data);
    },
  });
}

/**
 * Fetch direct (RSC) du détail par slug ; `null` si le groupe n'existe pas.
 * Une panne (5xx, base indisponible) est propagée et non traduite en 404.
 */
export async function fetchBandBySlug(
  slug: string,
  /**
   * Langue de lecture : la biographie est servie traduite quand elle
   * l'est. Elle passe par la QUERY et non par un en-tête, pour que deux
   * langues soient deux entrées de cache distinctes.
   */
  locale: Locale,
  init?: { signal?: AbortSignal },
): Promise<BandDetail | null> {
  return fetchPublicOrNull(
    `/api/bands/by-slug/${encodeURIComponent(slug)}?locale=${locale}`,
    bandDetailSchema,
    { signal: init?.signal },
  );
}

/**
 * Synchronise les genres d'un groupe.
 *
 * Hors de `createEntityHooks` : ce n'est pas une mise à jour de champ
 * mais un REMPLACEMENT complet d'une table de jonction, servi par une
 * route dédiée (`PUT /api/bands/:id/genres`). Le détail du groupe est
 * invalidé ensuite, ses genres y étant joints.
 */
export function useSyncBandGenres(bandId: string) {
  const qc = useQueryClient();
  return useMutation<{ bandId: string; genreIds: string[] }, Error, string[]>({
    mutationFn: (genreIds) =>
      apiJson(`/api/bands/${bandId}/genres`, {
        method: "PUT",
        body: setBandGenresSchema.parse({ genreIds }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bandKeys.detail(bandId) });
      void qc.invalidateQueries({ queryKey: ["bands", "by-slug"] });
    },
  });
}
