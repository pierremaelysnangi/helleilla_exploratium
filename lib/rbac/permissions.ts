/**
 * Matrice de permissions RBAC.
 * Définit les ressources et actions gérées, la matrice rôle -> ressources
 -> actions autorisées, et la fonction de contrôle `can`.
 */

// Rôles définis dans roles.ts (clés de la matrice)
import type { Role } from "./roles";

// Ressources gérées par l'app
export type Resource =
  "band" | "album" | "track" | "genre" | "user" | "contribution" | "forum";
// Actions applicables à chaque ressource
export type Action = "create" | "read" | "update" | "delete" | "moderate";

/** Matrice : pour chaque rôle, les actions autorisées par ressource. */
type PermissionMatrix = Record<Role, Partial<Record<Resource, Action[]>>>;

// Permissions granulaires par rôle
export const PERMISSIONS: PermissionMatrix = {
  user: {
    band: ["read"],
    album: ["read"],
    track: ["read"],
    genre: ["read"],
    // Un utilisateur connecté peut suivre ses propres contributions
    contribution: ["read"],
    // Donner son avis ne demande pas le rôle contributeur : c'est une
    // opinion, pas une fiche encyclopédique. La suppression du sien est
    // vérifiée sur l'auteur, pas sur la matrice.
    forum: ["read", "create"],
  },
  contributor: {
    band: ["read", "create", "update"],
    album: ["read", "create", "update"],
    track: ["read", "create", "update"],
    genre: ["read"],
    // Soumettre des contributions et compléter les preuves demandées
    contribution: ["read", "create", "update"],
    forum: ["read", "create"],
  },
  moderator: {
    band: ["read", "create", "update", "delete", "moderate"],
    album: ["read", "create", "update", "delete", "moderate"],
    track: ["read", "create", "update", "delete", "moderate"],
    genre: ["read", "create", "update"],
    // Relecture de la file complète : demandes de preuves, approbations
    contribution: ["read", "create", "update", "moderate"],
    // La modération retire un avis d'autrui ; elle n'en modifie aucun.
    forum: ["read", "create", "delete", "moderate"],
  },
  admin: {
    band: ["read", "create", "update", "delete", "moderate"],
    album: ["read", "create", "update", "delete", "moderate"],
    track: ["read", "create", "update", "delete", "moderate"],
    genre: ["read", "create", "update", "delete"],
    user: ["read", "update", "delete", "moderate"],
    // Rejet terminal manuel réservé aux admins
    contribution: ["read", "create", "update", "moderate", "delete"],
    forum: ["read", "create", "delete", "moderate"],
  },
};

/**
 * Contrôle si un rôle peut effectuer une action sur une ressource.
 *
 * @param role - Rôle de l'utilisateur.
 * @param resource - Ressource cible (band, album...).
 * @param action - Action demandée (create, delete...).
 * @returns true si la combinaison est autorisée par la matrice, sinon false.
 */
export function can(role: Role, resource: Resource, action: Action): boolean {
  const allowed = PERMISSIONS[role]?.[resource];
  return allowed?.includes(action) ?? false;
}
