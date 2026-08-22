import type { Role } from "./roles";

// Ressources gérées par l'app
export type Resource = "band" | "album" | "track" | "genre" | "user";
export type Action = "create" | "read" | "update" | "delete" | "moderate";

type PermissionMatrix = Record<Role, Partial<Record<Resource, Action[]>>>;

// Permissions granulaires par rôle
export const PERMISSIONS: PermissionMatrix = {
  user: {
    band: ["read"],
    album: ["read"],
    track: ["read"],
    genre: ["read"],
  },
  contributor: {
    band: ["read", "create", "update"],
    album: ["read", "create", "update"],
    track: ["read", "create", "update"],
    genre: ["read"],
  },
  moderator: {
    band: ["read", "create", "update", "delete", "moderate"],
    album: ["read", "create", "update", "delete", "moderate"],
    track: ["read", "create", "update", "delete", "moderate"],
    genre: ["read", "create", "update"],
  },
  admin: {
    band: ["read", "create", "update", "delete", "moderate"],
    album: ["read", "create", "update", "delete", "moderate"],
    track: ["read", "create", "update", "delete", "moderate"],
    genre: ["read", "create", "update", "delete"],
    user: ["read", "update", "delete", "moderate"],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  const allowed = PERMISSIONS[role]?.[resource];
  return allowed?.includes(action) ?? false;
}