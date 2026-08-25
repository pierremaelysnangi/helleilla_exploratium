/**
 * Hooks TanStack Query pour les pistes (/api/tracks).
 * Même structure que use-bands : fabrique générique + schémas partagés,
 * ré-exportée sous des noms explicites.
 */

// Fabrique générique d'hooks CRUD
import { createEntityHooks } from "./api/entity";
// Clés de requête de l'entité
import { trackKeys } from "./api/queryKeys";
// Schéma de ligne sérialisée
import { trackRowSchema } from "./api/schemas";
// Schémas des corps de mutation
import {
  createTrackSchema,
  updateTrackBodySchema,
} from "@/lib/validations/track";

/** Jeu d'hooks configuré pour les pistes. */
const tracksHooks = createEntityHooks({
  basePath: "/api/tracks",
  keys: trackKeys,
  rowSchema: trackRowSchema,
  createSchema: createTrackSchema,
  updateSchema: updateTrackBodySchema,
});

/** Options de requête de la liste paginée. */
export const tracksListOptions = tracksHooks.listQueryOptions;
/** Options de requête du détail. */
export const trackDetailOptions = tracksHooks.detailQueryOptions;
/** Liste paginée de pistes. */
export const useTracks = tracksHooks.useList;
/** Détail d'une piste par id. */
export const useTrack = tracksHooks.useDetail;
/** Création d'une piste (contributor+). */
export const useCreateTrack = tracksHooks.useCreate;
/** Mise à jour partielle d'une piste (contributor+). */
export const useUpdateTrack = tracksHooks.useUpdate;
/** Suppression d'une piste (moderator+). */
export const useDeleteTrack = tracksHooks.useDelete;
