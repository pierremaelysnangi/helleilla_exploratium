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
import { queryOptions } from "@tanstack/react-query";
import { apiJson } from "./api/client";
import { bandDetailSchema, type BandDetail } from "./api/schemas";

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

/** Fetch direct (RSC) du détail par slug ; null si 404. */
export async function fetchBandBySlug(
  slug: string,
  init?: { signal?: AbortSignal },
): Promise<BandDetail | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/bands/by-slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 }, signal: init?.signal },
  );
  if (!res.ok) return null;
  const payload: unknown = await res.json();
  // Enveloppe { data }
  return bandDetailSchema.parse((payload as { data: unknown }).data);
}
