/**
 * <ForumSubjectLink> — le sujet d'un avis, sous forme de lien.
 *
 * Un avis n'a de sens que rattaché à ce dont il parle. Le lien mène
 * toujours à l'adresse canonique : la fiche du groupe, ou celle de
 * l'album dans son groupe — un slug d'album n'étant unique qu'au sein
 * du sien.
 */

import Link from "next/link";
import type { ForumSubject } from "@/hooks/api/schemas";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Adresse canonique du sujet. */
export function subjectHref(subject: ForumSubject): string {
  return subject.kind === "band"
    ? `/bands/${subject.slug}`
    : `/bands/${subject.bandSlug}/albums/${subject.slug}`;
}

export function ForumSubjectLink({
  subject,
  t,
}: {
  subject: ForumSubject;
  t: Dictionary;
}) {
  return (
    <span className="flex flex-wrap items-baseline gap-2">
      <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase">
        {subject.kind === "band" ? t.forum.band : t.releaseType.album}
      </span>
      <Link
        href={subjectHref(subject)}
        className="text-foreground text-sm font-semibold hover:underline"
      >
        {subject.name}
      </Link>
    </span>
  );
}
