"use client";

/**
 * Hooks du forum : lecture paginée d'un fil, publication et retrait.
 *
 * Hors de `createEntityHooks` : le forum n'a pas de détail par
 * identifiant ni de mise à jour. Un avis se lit dans un fil, se publie
 * et se retire — reprendre la fabrique CRUD aurait exposé trois hooks
 * inutiles pour en obtenir deux.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { apiJson, apiJsonEnvelope, ApiClientError } from "./api/client";
import { forumKeys } from "./api/queryKeys";
import { forumPostSchema, type ForumPost } from "./api/schemas";
import type { CreateForumPostInput } from "@/lib/validations/forum";

/** Nombre d'avis chargés par page. */
export const FORUM_PAGE_SIZE = 20;

const pageSchema = z.object({
  data: z.array(forumPostSchema),
  meta: z.object({ page: z.number(), totalPages: z.number() }).loose(),
});

/** Restreint le fil à un groupe ou à un album ; vide = fil général. */
export type ForumFilter = { bandId?: string; albumId?: string };

/**
 * Fil d'avis, chargé page par page.
 *
 * @param filter - Sujet, ou rien pour le fil général.
 */
export function useForumFeed(filter: ForumFilter = {}) {
  return useInfiniteQuery({
    queryKey: forumKeys.list(filter),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const payload = await apiJsonEnvelope("/api/forum", {
        signal,
        query: {
          page: pageParam,
          perPage: FORUM_PAGE_SIZE,
          bandId: filter.bandId,
          albumId: filter.albumId,
        },
      });
      return pageSchema.parse(payload);
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

/**
 * Publie un avis.
 *
 * Invalide TOUTES les listes : le message apparaît à la fois dans le fil
 * de son sujet et dans le fil général.
 */
export function useCreateForumPost() {
  const qc = useQueryClient();
  return useMutation<ForumPost, ApiClientError, CreateForumPostInput>({
    mutationFn: (input) =>
      apiJson<ForumPost>("/api/forum", { method: "POST", body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: forumKeys.lists() });
    },
  });
}

/** Retire un avis : le sien, ou n'importe lequel avec la modération. */
export function useDeleteForumPost() {
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean }, ApiClientError, string>({
    mutationFn: (id) =>
      apiJson<{ deleted: boolean }>(`/api/forum/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: forumKeys.lists() });
    },
  });
}
