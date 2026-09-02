/**
 * Hooks TanStack Query pour les genres (/api/genres).
 * Même structure que use-bands : fabrique générique + schémas partagés,
 * ré-exportée sous des noms explicites.
 */

// Fabrique générique d'hooks CRUD
import { createEntityHooks } from "./api/entity";
// Clés de requête de l'entité
import { genreKeys } from "./api/queryKeys";
// Schéma de ligne sérialisée
import { genreRowSchema } from "./api/schemas";
// Schémas des corps de mutation
import { createGenreSchema, updateGenreSchema } from "@/lib/validations/genre";

/** Jeu d'hooks configuré pour les genres. */
const genresHooks = createEntityHooks({
  basePath: "/api/genres",
  keys: genreKeys,
  rowSchema: genreRowSchema,
  createSchema: createGenreSchema,
  // Le PATCH attend un corps partiel sans id ; on réutilise le schéma
  // complet partielisé (l'id est transmis séparément au hook)
  updateSchema: updateGenreSchema.partial(),
});

/** Options de requête de la liste paginée. */
export const genresListOptions = genresHooks.listQueryOptions;
/** Options de requête du détail. */
export const genreDetailOptions = genresHooks.detailQueryOptions;
/** Liste paginée de genres. */
export const useGenres = genresHooks.useList;
/** Détail d'un genre par id. */
export const useGenre = genresHooks.useDetail;
/** Création d'un genre (moderator+). */
export const useCreateGenre = genresHooks.useCreate;
/** Mise à jour partielle d'un genre (moderator+). */
export const useUpdateGenre = genresHooks.useUpdate;
/** Suppression d'un genre (admin). */
export const useDeleteGenre = genresHooks.useDelete;

// Lecture publique par slug (page détail SSR)
import { queryOptions } from "@tanstack/react-query";
import { apiJson } from "./api/client";
// Fetch RSC partagé : déballe { data } et distingue 404 de panne
import { fetchPublicOrNull } from "@/lib/api/client";
import { genreDetailSchema, type GenreDetail } from "./api/schemas";

/** Options de requête du détail genre par slug (unique globalement). */
export function genreBySlugOptions(slug: string) {
  return queryOptions({
    queryKey: ["genres", "by-slug", slug],
    queryFn: async ({ signal }): Promise<GenreDetail> => {
      const data = await apiJson<unknown>(
        `/api/genres/by-slug/${encodeURIComponent(slug)}`,
        { signal },
      );
      return genreDetailSchema.parse(data);
    },
  });
}

/**
 * Fetch direct (RSC) du détail genre ; `null` si le genre n'existe pas.
 * Une panne est propagée, pas traduite en 404.
 */
export async function fetchGenreBySlug(
  slug: string,
  init?: { signal?: AbortSignal },
): Promise<GenreDetail | null> {
  return fetchPublicOrNull(
    `/api/genres/by-slug/${encodeURIComponent(slug)}`,
    genreDetailSchema,
    { signal: init?.signal },
  );
}
