/**
 * Gardes RBAC pour les Server Actions.
 * Lèvent une `ActionError` si la session ou la permission manque :
 * `requireSession` (authentification), `requireRole` (rôle minimal)
 * et `requirePermission` (action sur ressource via la matrice RBAC).
 */
// lib/rbac/guards.ts
// Lecture des en-têtes de la requête courante (contexte Next.js)
import { headers } from "next/headers";
// Authentification Better Auth + type de session
import { auth, type Session } from "@/lib/auth";
// Contrôle d'accès par matrice de permissions
import { can, type Resource, type Action } from "./permissions";
// Hiérarchie des rôles
import { hasMinRole, type Role } from "./roles";

/** Erreur métier levée par les gardes ; portée par un code d'échec. */
export class ActionError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "ActionError";
  }
}

// Session dont l'utilisateur est garanti non nul avec un rôle typé
type SessionWithRole =
  Awaited<ReturnType<typeof auth.api.getSession>> extends infer S
    ? S extends null
      ? never
      : Omit<S, "user"> & {
          user: S extends { user: infer U } ? U & { role: Role } : never;
        }
    : never;

/**
 * Récupère la session courante ou lève une ActionError UNAUTHENTICATED.
 *
 * @returns La session Better Auth garantie non nulle (utilisateur typé).
 * @throws ActionError si aucune session n'est présente.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ActionError("Non authentifié.", "UNAUTHENTICATED");
  return session as SessionWithRole;
}

/** Alias de `requireSession` : exige simplement un utilisateur connecté. */
export async function requireAuth() {
  return requireSession();
}

/**
 * Exige que l'utilisateur ait au minimum le rôle donné (hiérarchie).
 *
 * @param minRole - Rôle minimal requis (ex : "moderator").
 * @returns La session si le rôle est suffisant.
 * @throws ActionError FORBIDDEN si le rôle est insuffisant.
 */
export async function requireRole(minRole: Role) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;
  if (!hasMinRole(role, minRole))
    throw new ActionError("Rôle insuffisant.", "FORBIDDEN");
  return session;
}

/**
 * Exige que le rôle de l'utilisateur autorise l'action sur la ressource
 * selon la matrice de permissions.
 *
 * @param resource - Ressource cible ("band", "album"...).
 * @param action - Action demandée ("create", "delete"...).
 * @returns La session si la permission est accordée.
 * @throws ActionError FORBIDDEN si la permission est refusée.
 */
export async function requirePermission(resource: Resource, action: Action) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;
  if (!can(role, resource, action))
    throw new ActionError("Permission refusée.", "FORBIDDEN");
  return session;
}
