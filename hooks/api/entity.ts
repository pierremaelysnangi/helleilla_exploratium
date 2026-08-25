/**
 * Fabrique d'hooks TanStack Query pour une entité CRUD de l'API.
 * Génère, à partir d'un chemin de base et de schémas zod :
 * - les `queryOptions` typées (liste paginée + détail) ;
 * - les hooks `useList` / `useDetail` ;
 * - les mutations create/update/delete avec invalidations ciblées.
 * Utilisée par use-bands/use-albums/use-tracks/use-genres afin d'éviter
 * quatre copies quasi identiques du même câblage.
 */

// Validation runtime des réponses
import { z } from "zod";
// Primitives TanStack Query : options, requête, mutation, cache
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
// Client HTTP navigateur + erreur typée des mutations
import { apiJson, apiJsonEnvelope, ApiClientError } from "./client";
// Forme des clés produites par entityKeys() de queryKeys.ts
import type { entityKeys } from "./queryKeys";

/** Paramètres communs aux listes paginées. */
type ListParams = {
  page?: number;
  perPage?: number;
  q?: string;
};

/** Métadonnées de pagination renvoyées par les routes GET de liste. */
const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

/** Enveloppe paginée brute `{ data, meta }`, validée ligne à ligne. */
function paginatedEnvelope<T extends z.ZodTypeAny>(rowSchema: T) {
  return z.object({
    data: z.array(rowSchema),
    meta: paginationMetaSchema,
  });
}

/** Configuration d'une entité : chemin API, clés et schémas zod. */
type EntityConfig<
  TRowSchema extends z.ZodTypeAny,
  TCreateSchema extends z.ZodTypeAny | undefined,
  TUpdateSchema extends z.ZodTypeAny | undefined,
> = {
  /** Chemin de base de la ressource (ex : "/api/bands"). */
  basePath: string;
  /** Clés de requête produites par queryKeys.ts. */
  keys: ReturnType<typeof entityKeys>;
  /** Schéma zod d'une ligne sérialisée (validation runtime des réponses). */
  rowSchema: TRowSchema;
  /** Schéma zod du corps POST ; requis pour useCreate. */
  createSchema: TCreateSchema;
  /** Schéma zod du corps PATCH ; requis pour useUpdate. */
  updateSchema: TUpdateSchema;
};

/**
 * Construit le jeu complet d'hooks pour une entité CRUD.
 *
 * @param config - Chemin de base, clés de requête et schémas zod.
 * @returns queryOptions typées, hooks de lecture et mutations invalidantes.
 */
export function createEntityHooks<
  TRowSchema extends z.ZodTypeAny,
  TCreateSchema extends z.ZodTypeAny | undefined = undefined,
  TUpdateSchema extends z.ZodTypeAny | undefined = undefined,
>(config: EntityConfig<TRowSchema, TCreateSchema, TUpdateSchema>) {
  // Types dérivés des schémas : sortie validée pour les lignes,
  // entrée (pré-parse) pour les corps de mutation
  type Row = z.output<TRowSchema>;
  type CreateInput = TCreateSchema extends z.ZodTypeAny
    ? z.input<TCreateSchema>
    : never;
  type UpdateInput = TUpdateSchema extends z.ZodTypeAny
    ? z.input<TUpdateSchema>
    : never;

  const { basePath, keys, rowSchema } = config;

  /**
   * Options de requête de la liste paginée.
   * @param params - Pagination + filtre texte ; sert de clé de cache.
   */
  function listQueryOptions(params: ListParams = {}) {
    return queryOptions({
      queryKey: keys.list(params),
      queryFn: async ({ signal }) => {
        // Enveloppe brute : apiJson déballerait et perdrait `meta`
        const payload = await apiJsonEnvelope(basePath, {
          query: params,
          signal,
        });
        // Validation runtime : on ne rend que des lignes conformes
        const parsed = paginatedEnvelope(rowSchema).parse(payload);
        return parsed;
      },
    });
  }

  /** Hook de lecture d'une liste paginée. */
  function useList(params: ListParams = {}) {
    return useQuery(listQueryOptions(params));
  }

  /**
   * Options de requête du détail par identifiant.
   * @param id - UUID de l'entité ; requête désactivée si absent/null.
   */
  function detailQueryOptions(id: string | undefined | null) {
    return queryOptions({
      queryKey: keys.detail(id ?? ""),
      enabled: Boolean(id),
      queryFn: async ({ signal }): Promise<Row> => {
        const data = await apiJson<unknown>(`${basePath}/${id}`, { signal });
        return rowSchema.parse(data);
      },
    });
  }

  /** Hook de lecture d'un détail (inactif tant que `id` est vide). */
  function useDetail(id: string | undefined | null) {
    return useQuery(detailQueryOptions(id));
  }

  /**
   * Création : POST sur le chemin de base.
   * Invalide toutes les listes de l'entité en cas de succès.
   */
  function useCreate() {
    const qc = useQueryClient();
    return useMutation<Row, ApiClientError, CreateInput>({
      mutationFn: async (input) => {
        const body =
          config.createSchema !== undefined
            ? config.createSchema.parse(input)
            : input;
        return apiJson<Row>(basePath, { method: "POST", body });
      },
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: keys.lists() });
      },
    });
  }

  /**
   * Mise à jour partielle : PATCH /:id (l'id est séparé du corps).
   * Invalide le détail modifié et toutes les listes.
   */
  function useUpdate() {
    const qc = useQueryClient();
    return useMutation<Row, ApiClientError, UpdateInput & { id: string }>({
      mutationFn: async ({ id, ...input }) => {
        const body =
          config.updateSchema !== undefined
            ? config.updateSchema.parse(input)
            : input;
        return apiJson<Row>(`${basePath}/${id}`, { method: "PATCH", body });
      },
      onSuccess: (_row, variables) => {
        void qc.invalidateQueries({ queryKey: keys.detail(variables.id) });
        void qc.invalidateQueries({ queryKey: keys.lists() });
      },
    });
  }

  /**
   * Suppression : DELETE /:id (l'API renvoie `{ deleted: true }`).
   * Invalide toute l'entité (listes + détails).
   */
  function useDelete() {
    const qc = useQueryClient();
    return useMutation<{ deleted: boolean }, ApiClientError, string>({
      mutationFn: (id) =>
        apiJson<{ deleted: boolean }>(`${basePath}/${id}`, {
          method: "DELETE",
        }),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: keys.all });
      },
    });
  }

  return {
    listQueryOptions,
    detailQueryOptions,
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
  };
}
