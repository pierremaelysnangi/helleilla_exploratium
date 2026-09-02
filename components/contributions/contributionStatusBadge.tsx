/**
 * <ContributionStatusBadge> — statut d'un dossier de contribution.
 *
 * Le vocabulaire affiché suit celui du workflow : « preuves demandées »
 * n'est pas un refus mais une étape de dialogue, et seul « rejeté » est
 * terminal. Le rendu le reflète — un seul statut est destructif.
 */

import { Badge } from "@/components/ui/badge";
import type { ContributionStatus } from "@/hooks/api/schemas";

/** Libellé et intention visuelle de chaque statut. */
const STATUS_META: Record<
  ContributionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  pending: { label: "En attente de relecture", variant: "secondary" },
  evidence_requested: { label: "Preuves demandées", variant: "outline" },
  approved: { label: "Approuvé", variant: "default" },
  expired: { label: "Expiré", variant: "outline" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

type ContributionStatusBadgeProps = {
  status: ContributionStatus;
};

export function ContributionStatusBadge({
  status,
}: ContributionStatusBadgeProps) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/** Libellé seul, pour les contextes sans badge (titres, aria-label). */
export function contributionStatusLabel(status: ContributionStatus): string {
  return STATUS_META[status].label;
}
