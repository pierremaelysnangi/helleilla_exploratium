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
