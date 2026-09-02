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

// Taxonomie complète, partagée par les filtres du catalogue
import { useQuery } from "@tanstack/react-query";
import { apiJsonEnvelope } from "./api/client";
import { z } from "zod";
import type { GenreRow } from "./api/schemas";

/** Taille de page maximale acceptée par l'API (`paginationSchema`). */
const MAX_PER_PAGE = 100;

const genrePageSchema = z.object({
  data: z.array(genreRowSchema),
  meta: z.object({ totalPages: z.number() }).loose(),
});

/**
 * Récupère la taxonomie ENTIÈRE, en enchaînant les pages.
 *
 * L'API plafonne `perPage` à 100 : demander davantage renvoie une 400,
 * et se contenter de la première page tronquerait silencieusement les
 * filtres dès que la taxonomie dépasse cent entrées.
 */
async function fetchAllGenres(signal?: AbortSignal): Promise<GenreRow[]> {
  const all: GenreRow[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const payload = await apiJsonEnvelope("/api/genres", {
      signal,
      query: { page, perPage: MAX_PER_PAGE, order: "asc" },
    });
    const parsed = genrePageSchema.parse(payload);
    all.push(...parsed.data);
    totalPages = parsed.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return all;
}

/** Un genre racine et ses sous-genres, prêts pour un affichage groupé. */
export type GenreFamily = {
  root: GenreRow;
  children: GenreRow[];
};

/**
 * Taxonomie complète, organisée en familles.
 *
 * La donnée bouge rarement : un `staleTime` d'une heure évite de la
 * recharger à chaque ouverture d'un filtre.
 */
export function useGenreTaxonomy() {
  const query = useQuery({
    queryKey: ["genres", "taxonomy"],
    queryFn: ({ signal }) => fetchAllGenres(signal),
    staleTime: 3_600_000,
  });

  const genres = query.data ?? [];
  const families: GenreFamily[] = genres
    .filter((g) => !g.parentId)
    .map((root) => ({
      root,
      children: genres.filter((g) => g.parentId === root.id),
    }));

  return { ...query, genres, families };
}
