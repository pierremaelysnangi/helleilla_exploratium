/**
 * <LatestForumPosts> — les derniers avis, sur la page d'accueil.
 *
 * Remplace « Derniers groupes ajoutés », qui redisait ce que la grille
 * du catalogue montre déjà. Ce qu'un visiteur ne peut voir nulle part
 * ailleurs, c'est ce qui vient d'être écrit : le fil donne à l'accueil
 * une raison d'être consulté deux fois.
 *
 * Chaque avis est TRONQUÉ : l'accueil invite à lire, la page Forums fait
 * lire. Le texte complet reste à un clic.
 */

import Link from "next/link";
import {
  ForumSubjectLink,
  subjectHref,
} from "@/components/forum/forumSubjectLink";
import type { ForumPost } from "@/db/queries/forum";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatLongDate } from "@/lib/i18n/dates";
import type { Locale } from "@/lib/i18n/locales";

/** Longueur au-delà de laquelle l'extrait est coupé. */
const EXCERPT_LENGTH = 220;

function excerpt(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > EXCERPT_LENGTH
    ? `${flat.slice(0, EXCERPT_LENGTH).trimEnd()}…`
    : flat;
}

export function LatestForumPosts({
  posts,
  t,
  locale,
}: {
  posts: ForumPost[];
  t: Dictionary;
  locale: Locale;
}) {
  // Rien à montrer : la section disparaît plutôt que d'afficher un vide.
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="forums" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="forums" className="metal-title text-lg">
          {t.nav.forums}
        </h2>
        <Link
          href="/forums"
          className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
        >
          {t.forum.seeAll}
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {posts.map((post) => (
          <li key={post.id} className="metal-card flex flex-col gap-2 p-4">
            <ForumSubjectLink subject={post.subject} t={t} />
            <Link
              href={subjectHref(post.subject)}
              className="text-sm leading-relaxed"
            >
              {excerpt(post.body)}
            </Link>
            <p className="text-muted-foreground text-xs">
              {`${post.authorName ?? t.forum.deletedAccount} · ${formatLongDate(
                locale,
                post.createdAt,
              )}`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
