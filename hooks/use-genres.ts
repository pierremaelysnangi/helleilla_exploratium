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
