/**
 * <ContributionStatusBadge> — statut d'un dossier de contribution.
 *
 * Le vocabulaire affiché suit celui du workflow : « preuves demandées »
 * n'est pas un refus mais une étape de dialogue, et seul « rejeté » est
 * terminal. Le rendu le reflète — un seul statut est destructif.
 */

import { Badge } from "@/components/ui/badge";
import type { ContributionStatus } from "@/hooks/api/schemas";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Intention visuelle de chaque statut.
 *
 * Un seul est destructif : le rendu doit distinguer « preuves
 * demandées », qui ouvre un dialogue, de « rejeté », qui le clôt.
 */
const STATUS_VARIANTS: Record<
  ContributionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  evidence_requested: "outline",
  approved: "default",
  expired: "outline",
  rejected: "destructive",
};

type ContributionStatusBadgeProps = {
  t: Dictionary;
  status: ContributionStatus;
};

export function ContributionStatusBadge({
  t,
  status,
}: ContributionStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {contributionStatusLabel(t, status)}
    </Badge>
  );
}

/** Libellé seul, pour les contextes sans badge (titres, aria-label). */
export function contributionStatusLabel(
  t: Dictionary,
  status: ContributionStatus,
): string {
  return t.contributionStatus[status];
}
