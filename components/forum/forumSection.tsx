"use client";

/**
 * <ForumSection> — la discussion d'un groupe ou d'un album, sur sa fiche.
 *
 * Le sujet est fixé par la page qui monte le composant : on écrit son
 * avis là où on vient de lire, et le fil affiché est celui de ce seul
 * sujet. Le libellé du sujet est donc masqué dans les cartes — le
 * répéter à chaque message redirait ce que le titre de la page annonce.
 */

import { useT } from "@/lib/i18n/client";
import { ForumComposer } from "./forumComposer";
import { ForumFeed } from "./forumFeed";

export function ForumSection({
  bandId,
  albumId,
}: {
  bandId?: string;
  albumId?: string;
}) {
  const t = useT();
  const filter = bandId ? { bandId } : { albumId };

  return (
    <section aria-label={t.nav.forums} className="flex flex-col gap-4">
      <h2 className="metal-title text-lg">{t.nav.forums}</h2>
      <ForumComposer bandId={bandId} albumId={albumId} />
      <ForumFeed filter={filter} showSubject={false} />
    </section>
  );
}
