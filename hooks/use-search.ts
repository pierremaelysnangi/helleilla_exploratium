/**
 * Hook de recherche globale (/api/search) avec debounce.
 * Combine useDebounce et useQuery : la requête n'est déclenchée que
 * lorsque le terme est stable et non vide ; les résultats sont validés
 * par le schéma partagé `globalSearchResponseSchema`.
 */

// Requête + options TanStack Query
import { useQuery, queryOptions } from "@tanstack/react-query";
// Validation runtime de la réponse groupée (source unique avec la route)
import {
  globalSearchQuerySchema,
  globalSearchResponseSchema,
} from "@/lib/api/schemas";
// Client HTTP navigateur
import { apiJson } from "./api/client";
// Clés de requête de la recherche
import { searchKeys } from "./api/queryKeys";
// Debounce du terme saisi
import { useDebounce } from "./use-debounce";

/** Paramètres du hook de recherche. */
type SearchParams = {
  /** Terme brut saisi par l'utilisateur (debouncé en interne). */
  q: string;
  /** Résultats max par index (1–20, défaut 5). */
  limit?: number;
  /** Délai de debounce en ms (défaut 300). */
  debounceMs?: number;
};

/**
 * Options de requête de la recherche globale.
 * Exposées séparément pour permettre un prefetch côté serveur si besoin.
 */
export function globalSearchOptions(q: string, limit: number) {
  return queryOptions({
    queryKey: searchKeys.query(q, limit),
    enabled: q.trim().length > 0,
    queryFn: async ({ signal }) => {
      // Validation des entrées avant appel (même contrat que la route)
      const { q: validQ, limit: validLimit } = globalSearchQuerySchema.parse({
        q,
        limit,
      });
      const payload = await apiJson<unknown>("/api/search", {
        query: { q: validQ, limit: validLimit },
        signal,
      });
      return globalSearchResponseSchema.parse(payload);
    },
    // La recherche est éphémère : pas de revalidation en arrière-plan
    staleTime: 30_000,
  });
}

/**
 * Recherche globale debouncée sur les groupes, albums et pistes.
 *
 * @param params - Terme `q`, limite par index et délai de debounce.
 * @returns Résultat TanStack Query : `data` = `{ bands, albums, tracks }`,
 *   `isFetching` pendant la requête, requête inactive si `q` est vide
 *   après debounce.
 */
export function useGlobalSearch({
  q,
  limit = 5,
  debounceMs = 300,
}: SearchParams) {
  const debouncedQ = useDebounce(q.trim(), debounceMs);
  return useQuery(globalSearchOptions(debouncedQ, limit));
}
