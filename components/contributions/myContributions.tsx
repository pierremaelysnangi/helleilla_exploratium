"use client";

/**
 * <MyContributions> — suivi des dossiers soumis par l'utilisateur.
 *
 * Le point important est le statut `evidence_requested` : ce n'est pas un
 * refus mais une demande, et le contributeur doit pouvoir y répondre sans
 * quitter la page. Sans réponse après deux relances, le dossier expire de
 * lui-même — l'échéance est donc affichée.
 */

import { useState } from "react";
import Link from "next/link";
import { useMyContributions, useAddEvidence } from "@/hooks/use-contributions";
import type { ContributionRow } from "@/hooks/api/schemas";
import { ContributionStatusBadge } from "./contributionStatusBadge";
import {
  EvidenceFields,
  emptyEvidence,
  evidenceDiagnostics,
  type EvidenceDraft,
} from "./evidenceFields";
import { EmptyState } from "@/components/shared/emptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, usePlural } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

/** Formate une date ISO en date lisible, ou tiret si absente. */
function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function MyContributions() {
  const t = useT();
  const contributions = useMyContributions();

  if (contributions.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (contributions.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {t.contributions.loadFailed}
      </p>
    );
  }

  const rows = contributions.data ?? [];

  if (rows.length === 0) {
    return (
      <EmptyState
        title={t.contributions.noSubmission}
        description={t.contributions.noSubmissionDescription}
        ctaHref="/contributions"
        ctaLabel={t.contributions.proposeBand}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((contribution) => (
        <li key={contribution.id}>
          <ContributionCard contribution={contribution} />
        </li>
      ))}
    </ul>
  );
}

/** Fiche d'un dossier, avec réponse inline si des preuves sont demandées. */
function ContributionCard({ contribution }: { contribution: ContributionRow }) {
  const t = useT();
  const n = usePlural();
  const [answering, setAnswering] = useState(false);
  const [drafts, setDrafts] = useState<EvidenceDraft[]>([emptyEvidence()]);
  const addEvidence = useAddEvidence();

  const { items, valid } = evidenceDiagnostics(drafts);
  const awaitingEvidence = contribution.status === "evidence_requested";

  return (
    <article className="metal-card flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {contribution.payload.name ?? t.contributions.untitledSubmission}
          <span className="text-muted-foreground ml-2 text-xs font-normal">
            {contribution.type === "band_create"
              ? t.contributions.typeBandCreate
              : t.contributions.typeBandEnrich}
          </span>
        </h3>
        <ContributionStatusBadge t={t} status={contribution.status} />
      </header>

      <p className="text-muted-foreground text-xs">
        {`${interpolate(t.contributions.submittedOn, {
          date: formatDate(contribution.createdAt),
        })} · ${n(t.count.evidence, contribution.evidence.length)}`}
      </p>

      {/* {t.contributions.moderatorRequest} : la note explique ce qui manque */}
      {awaitingEvidence && contribution.reviewNotes && (
        <div className="border-border bg-background/40 rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            {t.contributions.moderatorRequest}
          </p>
          <p className="mt-1 text-sm">{contribution.reviewNotes}</p>
          {contribution.deadlineAt && (
            <p className="text-muted-foreground mt-2 text-xs">
              {interpolate(t.contributions.deadlineNotice, {
                date: formatDate(contribution.deadlineAt),
                reminder: contribution.reminderCount,
              })}
            </p>
          )}
        </div>
      )}

      {contribution.status === "approved" && contribution.payload.slug && (
        <Link
          href={`/bands/${contribution.payload.slug}`}
          className="text-sm underline"
        >
          {t.contributions.seePublished}
        </Link>
      )}

      {contribution.status === "expired" && (
        <p className="text-muted-foreground text-sm">
          {t.contributions.expiredNotice}
        </p>
      )}

      {/* Réponse inline à une demande de preuves */}
      {awaitingEvidence &&
        (answering ? (
          <div className="flex flex-col gap-3">
            <EvidenceFields
              value={drafts}
              onChange={setDrafts}
              disabled={addEvidence.isPending}
            />
            {addEvidence.isError && (
              <p role="alert" className="text-destructive text-sm">
                {addEvidence.error.message}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={items.length === 0 || addEvidence.isPending}
                onClick={() =>
                  addEvidence.mutate({ id: contribution.id, evidence: items })
                }
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase hover:opacity-90 disabled:opacity-50"
              >
                {addEvidence.isPending
                  ? t.app.sending
                  : t.contributions.sendEvidence}
              </button>
              <button
                type="button"
                onClick={() => setAnswering(false)}
                className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-xs font-semibold tracking-wide uppercase"
              >
                {t.app.cancel}
              </button>
            </div>
            {/* La règle complète ne s'applique qu'à la soumission initiale ;
                un complément peut ne contenir qu'une seule preuve. */}
            {!valid && items.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {t.contributions.evidenceComplement}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAnswering(true)}
            className="bg-primary text-primary-foreground self-start rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase hover:opacity-90"
          >
            {t.contributions.replyWithEvidence}
          </button>
        ))}
    </article>
  );
}
