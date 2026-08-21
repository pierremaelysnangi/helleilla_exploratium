import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasMinRole, type Role } from "./roles";
import { can, type Action, type Resource } from "./permissions";

/**
 * Récupère la session courante (serveur uniquement).
 * À utiliser dans Server Actions, Route Handlers, Server Components.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Exige une session valide. Throw si absent (à catcher côté action)
 * ou redirect si utilisé dans une page.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new RBACError("UNAUTHENTICATED", "Connexion requise");
  }
  return session;
}

/**
 * Exige un rôle minimum (hiérarchique).
 * Ex: requireRole("moderator") passe pour moderator ET admin.
 */
export async function requireRole(minRole: Role) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;

  if (!hasMinRole(role, minRole)) {
    throw new RBACError("FORBIDDEN", `Rôle "${minRole}" ou supérieur requis`);
  }
  return session;
}

/**
 * Exige une permission granulaire précise.
 * Ex: requirePermission("update", "band")
 */
export async function requirePermission(action: Action, resource: Resource) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;

  if (!can(role, action, resource)) {
    throw new RBACError(
      "FORBIDDEN",
      `Permission "${action}" sur "${resource}" refusée`
    );
  }
  return session;
}

/**
 * Version "page/layout" : redirige au lieu de throw.
 * À utiliser dans app/(admin)/layout.tsx par exemple.
 */
export async function requireRolePage(minRole: Role) {
  const session = await getSession();
  const role = (session?.user.role ?? "user") as Role;

  if (!session) redirect("/login");
  if (!hasMinRole(role, minRole)) redirect("/unauthorized");

  return session;
}

export class RBACError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN";
  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string) {
    super(message);
    this.code = code;
    this.name = "RBACError";
  }
}