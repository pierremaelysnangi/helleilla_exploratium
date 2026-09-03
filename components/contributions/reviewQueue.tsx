"use client";

/**
 * <ReviewQueue> — file de relecture des modérateurs.
 *
 * Le workflow privilégie le dialogue : demander des preuves est l'action
 * par défaut, l'approbation exige d'avoir lu les sources, et le rejet
 * terminal est réservé aux administrateurs. L'interface reflète cette
 * hiérarchie plutôt que de présenter trois boutons équivalents.
 */

import { useState } from "react";
import Link from "next/link";
import {
  useReviewQueue,
  useReviewContribution,
} from "@/hooks/use-contributions";
import type { ContributionRow, ContributionStatus } from "@/hooks/api/schemas";
import { ContributionStatusBadge } from "./contributionStatusBadge";
import { EmptyState } from "@/components/shared/emptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, usePlural } from "@/lib/i18n/client";
import { rich } from "@/lib/i18n/rich";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Filtres proposés au modérateur. */
const FILTERS: {
  value: ContributionStatus | undefined;
  label: (t: Dictionary) => string;
}[] = [
  { value: undefined, label: (t) => t.contributions.filterOpen },
  { value: "pending", label: (t) => t.contributions.filterPending },
  {
    value: "evidence_requested",
    label: (t) => t.contributionStatus.evidence_requested,
  },
  { value: "approved", label: (t) => t.contributions.filterApproved },
  { value: "expired", label: (t) => t.contributions.filterExpired },
];

type ReviewQueueProps = {
  /** Le rejet terminal n'est proposé qu'aux administrateurs. */
  canReject: boolean;
};

export function ReviewQueue({ canReject }: ReviewQueueProps) {
  const t = useT();
  const [status, setStatus] = useState<ContributionStatus | undefined>(
    undefined,
  );
  const queue = useReviewQueue(status);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t.app.filter}
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.value ?? "open"}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
            className={
              status === filter.value
                ? "border-primary/40 bg-primary/15 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase"
                : "border-border hover:bg-accent/30 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase"
            }
          >
            {filter.label(t)}
          </button>
        ))}
      </div>

      {queue.isPending && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {queue.isError && (
        <p role="alert" className="text-destructive text-sm">
          {t.contributions.queueLoadFailed}
        </p>
      )}

      {queue.isSuccess && queue.data.length === 0 && (
        <EmptyState
          title={t.contributions.nothingToReview}
          description={t.contributions.noMatchingSubmission}
        />
      )}

      <ul className="flex flex-col gap-3">
        {(queue.data ?? []).map((contribution) => (
          <li key={contribution.id}>
            <ReviewCard contribution={contribution} canReject={canReject} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Fiche de relecture : preuves cliquables et actions de transition. */
function ReviewCard({
  contribution,
  canReject,
}: {
  contribution: ContributionRow;
  canReject: boolean;
}) {
  const t = useT();
  const n = usePlural();
  const [notes, setNotes] = useState("");
  const [asking, setAsking] = useState(false);
  const review = useReviewContribution();

  const isOpen =
    contribution.status === "pending" ||
    contribution.status === "evidence_requested";

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

      {/* Les preuves sont l'objet même de la relecture : liens sortants */}
      <section
        aria-label={t.contributions.evidenceProvided}
        className="flex flex-col gap-1"
      >
        <h4 className="text-muted-foreground text-xs font-semibold uppercase">
          {n(t.count.evidence, contribution.evidence.length)}
        </h4>
        <ul className="flex flex-col gap-1">
          {contribution.evidence.map((item, index) => (
            <li key={index} className="text-sm">
              <span className="text-muted-foreground mr-2 text-xs uppercase">
                {item.kind}
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {item.url}
              </a>
              {item.note && (
                <span className="text-muted-foreground ml-2 text-xs">
                  {`— ${item.note}`}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {review.isError && (
        <p role="alert" className="text-destructive text-sm">
          {review.error.message}
        </p>
      )}

      {review.isSuccess && review.data.bandId && (
        <p className="text-sm">
          {rich(t.contributions.approvedNotice, {
            link: (
              <Link
                href={`/bands/${contribution.payload.slug ?? ""}`}
                className="underline"
              >
                {t.contributions.seePublished}
              </Link>
            ),
          })}
        </p>
      )}

      {isOpen && !review.isSuccess && (
        <div className="flex flex-col gap-2">
          {asking ? (
            <div className="flex flex-col gap-2">
              <label>
                <span className="text-muted-foreground mb-1 block text-xs">
                  {t.contributions.whatIsMissing}
                </span>
                <textarea
                  rows={3}
                  minLength={10}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={notes.trim().length < 10 || review.isPending}
                  onClick={() =>
                    review.mutate({
                      id: contribution.id,
                      status: "evidence_requested",
                      reviewNotes: notes.trim(),
                    })
                  }
                  className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase hover:opacity-90 disabled:opacity-50"
                >
                  {review.isPending
                    ? t.app.sending
                    : t.contributions.sendRequest}
                </button>
                <button
                  type="button"
                  onClick={() => setAsking(false)}
                  className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-xs font-semibold tracking-wide uppercase"
                >
                  {t.app.cancel}
                </button>
              </div>
              {notes.trim().length < 10 && (
                <p className="text-muted-foreground text-xs">
                  {t.contributions.requestMinLength}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* Action par défaut du workflow : demander, pas rejeter */}
              <button
                type="button"
                onClick={() => setAsking(true)}
                className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-xs font-semibold tracking-wide uppercase"
              >
                {t.contributions.requestEvidence}
              </button>
              <button
                type="button"
                disabled={review.isPending}
                onClick={() =>
                  review.mutate({ id: contribution.id, status: "approved" })
                }
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase hover:opacity-90 disabled:opacity-50"
              >
                {review.isPending
                  ? t.contributions.processing
                  : t.contributions.approve}
              </button>
              {canReject && (
                <button
                  type="button"
                  disabled={review.isPending}
                  onClick={() =>
                    review.mutate({ id: contribution.id, status: "rejected" })
                  }
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-md border px-4 py-2 text-xs font-semibold tracking-wide uppercase disabled:opacity-50"
                >
                  {t.contributions.rejectDefinitively}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
