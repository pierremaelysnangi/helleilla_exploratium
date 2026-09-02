/**
 * <RoleBadge> — rôle RBAC d'un compte.
 *
 * La hiérarchie est user < contributor < moderator < admin : le rendu la
 * rend visible d'un coup d'œil plutôt que de traiter les quatre rôles à
 * l'identique, l'administration consistant justement à situer un compte
 * dans cette échelle.
 */

import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/hooks/api/schemas";

/** Libellé et intention visuelle de chaque rôle. */
const ROLE_META: Record<
  UserRole,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  user: { label: "Utilisateur", variant: "outline" },
  contributor: { label: "Contributeur", variant: "secondary" },
  moderator: { label: "Modérateur", variant: "secondary" },
  admin: { label: "Administrateur", variant: "default" },
};

/** Ordre hiérarchique, réutilisé par les sélecteurs de rôle. */
export const ROLE_ORDER: UserRole[] = [
  "user",
  "contributor",
  "moderator",
  "admin",
];

/** Libellé seul, pour les options de formulaire. */
export function roleLabel(role: UserRole): string {
  return ROLE_META[role].label;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
