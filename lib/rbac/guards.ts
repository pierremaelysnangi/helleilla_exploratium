// lib/rbac/guards.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { can, type Resource, type Action } from "./permissions";
import { hasMinRole, type Role } from "./roles";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(minRole: Role) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;
  if (!hasMinRole(role, minRole)) throw new Error("FORBIDDEN");
  return session;
}

export async function requirePermission(resource: Resource, action: Action) {
  const session = await requireAuth();
  const role = (session.user.role ?? "user") as Role;
  if (!can(role, resource, action)) throw new Error("FORBIDDEN");
  return session;
}

