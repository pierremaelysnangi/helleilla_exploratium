/**
 * Point d'entrée du module RBAC.
 * Ré-exporte les rôles, la matrice de permissions et les gardes
 * afin de pouvoir importer tout depuis `@/lib/rbac`.
 */

// Types et helpers de rôles (Role, ROLE_LEVEL, hasMinRole)
export * from "./roles";
// Ressources, actions, matrice PERMISSIONS et fonction can()
export * from "./permissions";
// Gardes : ActionError, requireSession/Auth/Role/Permission
export * from "./guards";
