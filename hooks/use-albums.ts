/**
 * Hooks TanStack Query pour les albums (/api/albums).
 * Même structure que use-bands : fabrique générique + schémas partagés,
 * ré-exportée sous des noms explicites.
 */

// Fabrique générique d'hooks CRUD
import { createEntityHooks } from "./api/entity";
// Clés de requête de l'entité
import { albumKeys } from "./api/queryKeys";
// Schéma de ligne sérialisée
import { albumRowSchema } from "./api/schemas";
// Schémas des corps de mutation
import {
  createAlbumSchema,
  updateAlbumBodySchema,
} from "@/lib/validations/album";

/** Jeu d'hooks configuré pour les albums. */
const albumsHooks = createEntityHooks({
  basePath: "/api/albums",
  keys: albumKeys,
  rowSchema: albumRowSchema,
  createSchema: createAlbumSchema,
  updateSchema: updateAlbumBodySchema,
});

/** Options de requête de la liste paginée. */
export const albumsListOptions = albumsHooks.listQueryOptions;
/** Options de requête du détail. */
export const albumDetailOptions = albumsHooks.detailQueryOptions;
/** Liste paginée d'albums. */
export const useAlbums = albumsHooks.useList;
/** Détail d'un album par id. */
export const useAlbum = albumsHooks.useDetail;
/** Création d'un album (contributor+). */
export const useCreateAlbum = albumsHooks.useCreate;
/** Mise à jour partielle d'un album (contributor+). */
export const useUpdateAlbum = albumsHooks.useUpdate;
/** Suppression d'un album (moderator+). */
export const useDeleteAlbum = albumsHooks.useDelete;

// Lecture publique par slug (page détail SSR)
import { queryOptions } from "@tanstack/react-query";
import { apiJson } from "./api/client";
// Fetch RSC partagé : déballe { data } et distingue 404 de panne
import { fetchPublicOrNull } from "@/lib/api/client";
import { albumDetailSchema, type AlbumDetail } from "./api/schemas";

/**
 * Chemin canonique d'un album dans l'API.
 *
 * Le slug d'album n'étant unique QUE dans son groupe, l'adressage exige
 * les deux slugs — d'où un helper unique plutôt que des concaténations
 * dispersées.
 */
function albumBySlugPath(bandSlug: string, albumSlug: string) {
  return `/api/albums/by-slug/${encodeURIComponent(bandSlug)}/${encodeURIComponent(albumSlug)}`;
}

/** Options de requête du détail album par (slug groupe, slug album). */
export function albumBySlugOptions(bandSlug: string, albumSlug: string) {
  return queryOptions({
    queryKey: ["albums", "by-slug", bandSlug, albumSlug],
    queryFn: async ({ signal }): Promise<AlbumDetail> => {
      const data = await apiJson<unknown>(
        albumBySlugPath(bandSlug, albumSlug),
        { signal },
      );
      return albumDetailSchema.parse(data);
    },
  });
}

/**
 * Fetch direct (RSC) du détail album ; `null` si le groupe ou l'album
 * n'existe pas. Une panne est propagée, pas traduite en 404.
 */
export async function fetchAlbumBySlug(
  bandSlug: string,
  albumSlug: string,
  init?: { signal?: AbortSignal },
): Promise<AlbumDetail | null> {
  return fetchPublicOrNull(
    albumBySlugPath(bandSlug, albumSlug),
    albumDetailSchema,
    { signal: init?.signal },
  );
}
