/**
 * Définition des rôles applicatifs et de leur hiérarchie.
 * Fournit le type `Role`, le niveau associé à chaque rôle et la
 * comparaison `hasMinRole` utilisée par les gardes.
 */

// Liste close des rôles, du plus faible au plus puissant
export const ROLES = ["user", "contributor", "moderator", "admin"] as const;
/** Type union des rôles valides. */
export type Role = (typeof ROLES)[number];

// Plus le nombre est haut, plus le rôle est puissant
export const ROLE_LEVEL: Record<Role, number> = {
  user: 0,
  contributor: 1,
  moderator: 2,
  admin: 3,
};

/**
 * Vérifie qu'un rôle atteint au minimum un niveau requis (hiérarchie).
 *
 * @param role - Rôle effectif de l'utilisateur.
 * @param minRole - Rôle minimal exigé.
 * @returns true si `role` >= `minRole`, sinon false.
 */
export function hasMinRole(role: Role, minRole: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}
