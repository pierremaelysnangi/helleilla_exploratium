/**
 * Page « Forums » (/forums) — Server Component.
 *
 * Deux lectures complémentaires, et non redondantes :
 *
 * - les SUJETS ACTIFS répondent à « où ça discute en ce moment » ;
 * - le FIL répond à « qu'est-ce qui vient d'être écrit ».
 *
 * On n'écrit pas depuis cette page. Un avis se forme en lisant une
 * fiche : le formulaire vit donc sur la fiche du groupe ou de l'album,
 * là où l'on a sous les yeux ce dont on parle. Un sélecteur de sujet
 * ici aurait demandé de charger tout le catalogue dans une liste
 * déroulante pour choisir hors contexte.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ForumFeed } from "@/components/forum/forumFeed";
import {
  ForumSubjectLink,
  subjectHref,
} from "@/components/forum/forumSubjectLink";
import { listActiveSubjects } from "@/db/queries/forum";
import { getTranslations } from "@/lib/i18n/server";

/** Les avis arrivent en continu : pas de cache long sur cette page. */
export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t.nav.forums,
    description: t.meta.forumsDescription,
    alternates: { canonical: "/forums" },
  };
}

export default async function ForumsPage() {
  const { t, n } = await getTranslations();
  const subjects = await listActiveSubjects();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">{t.nav.forums}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          {t.forum.lead}
        </p>
      </header>

      {subjects.length > 0 && (
        <section
          aria-label={t.forum.activeSubjects}
          className="flex flex-col gap-3"
        >
          <h2 className="metal-title text-lg">{t.forum.activeSubjects}</h2>
          <ul className="3xl:grid-cols-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {subjects.map((entry) => (
              <li
                key={`${entry.subject.kind}-${entry.subject.slug}`}
                className="metal-card flex items-center justify-between gap-3 px-4 py-3"
              >
                <ForumSubjectLink subject={entry.subject} t={t} />
                <Link
                  href={subjectHref(entry.subject)}
                  className="text-muted-foreground hover:text-foreground shrink-0 text-xs"
                >
                  {n(t.count.posts, entry.posts)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label={t.forum.latestPosts} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.forum.latestPosts}</h2>
        <ForumFeed />
        <p className="text-muted-foreground text-xs">
          {t.forum.moderationNotice}
        </p>
      </section>
    </div>
  );
}
