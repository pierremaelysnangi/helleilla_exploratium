/**
 * Gardes RBAC pour les pages (Server Components).
 *
 * Distinctes de `guards.ts`, qui lève une `ActionError` destinée aux
 * Server Actions : une page doit produire une navigation, pas une
 * exception métier. On sépare donc deux situations que l'on confond
 * souvent :
 *
 * - non connecté      -> redirection vers /sign-in (l'utilisateur peut agir) ;
 * - connecté mais sans le droit -> pas de redirection, on l'affiche.
 *   Renvoyer un visiteur déjà authentifié vers une page de connexion est
 *   une impasse : il s'y reconnecterait pour être renvoyé au même endroit.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
// Instance Better Auth serveur
import { auth } from "@/lib/auth";
// Matrice de permissions
import { can, type Action, type Resource } from "./permissions";
import type { Role } from "./roles";

/** Session d'une page, avec le rôle résolu (repli « user »). */
export type PageSession = {
  userId: string;
  role: Role;
};

/**
 * Lit la session courante depuis les en-têtes de la requête.
 *
 * @returns La session avec son rôle, ou `null` pour un visiteur anonyme.
 */
export async function getPageSession(): Promise<PageSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  // Un compte dont le rôle n'a pas été projeté est traité au plus faible
  return {
    userId: session.user.id,
    role: (session.user.role ?? "user") as Role,
  };
}

/**
 * Exige une session ; redirige vers la connexion si le visiteur est anonyme.
 *
 * @param returnTo - Chemin où revenir après connexion.
 */
export async function requirePageSession(
  returnTo: string,
): Promise<PageSession> {
  const session = await getPageSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

/**
 * Exige une permission de la matrice RBAC.
 *
 * @param resource - Ressource visée.
 * @param action - Action demandée.
 * @param returnTo - Chemin où revenir après connexion.
 * @returns La session si la permission est accordée, `null` si l'utilisateur
 *   est connecté mais n'a pas le droit — à la page d'expliquer pourquoi.
 */
export async function requirePagePermission(
  resource: Resource,
  action: Action,
  returnTo: string,
): Promise<PageSession | null> {
  const session = await requirePageSession(returnTo);
  return can(session.role, resource, action) ? session : null;
}
