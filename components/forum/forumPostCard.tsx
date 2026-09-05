"use client";

/**
 * <ForumPostCard> — un avis, son sujet et son auteur.
 *
 * Le bouton de retrait n'apparaît qu'à qui peut réellement s'en servir :
 * l'auteur, ou la modération. L'API revérifie de toute façon — mais
 * proposer une action vouée au refus est une promesse qu'on ne tient
 * pas.
 */

import { useI18n } from "@/lib/i18n/client";
import { formatLongDate } from "@/lib/i18n/dates";
import { ForumSubjectLink } from "./forumSubjectLink";
import { useDeleteForumPost } from "@/hooks/use-forum";
import type { ForumPost } from "@/hooks/api/schemas";

export function ForumPostCard({
  post,
  /** Identifiant de la personne connectée, ou `null`. */
  viewerId,
  /** La modération peut retirer l'avis d'autrui. */
  canModerate = false,
  /** Masque le sujet dans un fil déjà consacré à un seul sujet. */
  showSubject = true,
}: {
  post: ForumPost;
  viewerId: string | null;
  canModerate?: boolean;
  showSubject?: boolean;
}) {
  const { t, locale } = useI18n();
  const remove = useDeleteForumPost();

  const mayRemove = canModerate || post.authorId === viewerId;

  return (
    <article className="metal-card flex flex-col gap-2 p-4">
      {showSubject && <ForumSubjectLink subject={post.subject} t={t} />}

      <p className="text-sm leading-relaxed whitespace-pre-line">{post.body}</p>

      <footer className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {/* Un compte supprimé laisse son avis, sans son nom : c'est le
            même parti pris que pour les contributions. */}
        <span>{post.authorName ?? t.forum.deletedAccount}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.createdAt}>
          {formatLongDate(locale, post.createdAt)}
        </time>
        {mayRemove && (
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.mutate(post.id)}
            className="hover:text-destructive ms-auto underline disabled:opacity-50"
          >
            {t.forum.remove}
          </button>
        )}
      </footer>

      {remove.isError && (
        <p role="alert" className="text-destructive text-xs">
          {remove.error.message}
        </p>
      )}
    </article>
  );
}
