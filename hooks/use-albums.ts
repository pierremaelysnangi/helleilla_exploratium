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
