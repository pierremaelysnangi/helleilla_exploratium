export const ROLES = ["user", "contributor", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];

// Plus le nombre est haut, plus le rôle est puissant
export const ROLE_LEVEL: Record<Role, number> = {
  user: 0,
  contributor: 1,
  moderator: 2,
  admin: 3,
};

export function hasMinRole(role: Role, minRole: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}
