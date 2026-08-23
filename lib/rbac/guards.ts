// lib/rbac/guards.ts
import { headers } from "next/headers";
import { auth, type Session } from "@/lib/auth";
import { can, type Resource, type Action } from "./permissions";
import { hasMinRole, type Role } from "./roles";

export class ActionError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "ActionError";
  }
}

type SessionWithRole =
  Awaited<ReturnType<typeof auth.api.getSession>> extends infer S
    ? S extends null
      ? never
      : Omit<S, "user"> & {
          user: S extends { user: infer U } ? U & { role: Role } : never;
        }
    : never;

export async function requireSession(): Promise<Session> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ActionError("Non authentifié.", "UNAUTHENTICATED");
  return session as SessionWithRole;
}

export async function requireAuth() {
  return requireSession();
}

export async function requireRole(minRole: Role) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;
  if (!hasMinRole(role, minRole))
    throw new ActionError("Rôle insuffisant.", "FORBIDDEN");
  return session;
}

export async function requirePermission(resource: Resource, action: Action) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;
  if (!can(role, resource, action))
    throw new ActionError("Permission refusée.", "FORBIDDEN");
  return session;
}
