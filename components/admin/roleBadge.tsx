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
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Intention visuelle de chaque rôle.
 *
 * Le LIBELLÉ n'est plus ici : il vient du dictionnaire, sans quoi la
 * hiérarchie s'affichait en français quelle que soit la langue choisie.
 */
const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  user: "outline",
  contributor: "secondary",
  moderator: "secondary",
  admin: "default",
};

/** Ordre hiérarchique, réutilisé par les sélecteurs de rôle. */
export const ROLE_ORDER: UserRole[] = [
  "user",
  "contributor",
  "moderator",
  "admin",
];

/** Libellé traduit, pour les options de formulaire. */
export function roleLabel(t: Dictionary, role: UserRole): string {
  return t.role[role];
}

export function RoleBadge({ t, role }: { t: Dictionary; role: UserRole }) {
  return <Badge variant={ROLE_VARIANTS[role]}>{roleLabel(t, role)}</Badge>;
}
