"use client";

/**
 * <ForumFeed> — fil d'avis, chargé page par page.
 *
 * Un bouton « charger plus » plutôt qu'un défilement infini : la page
 * Forums porte un pied de page utile, et un chargement automatique le
 * repousserait indéfiniment hors de portée.
 */

import { useSession } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/emptyState";
import { ForumPostCard } from "./forumPostCard";
import { useForumFeed, type ForumFilter } from "@/hooks/use-forum";
import { can } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/rbac/roles";

export function ForumFeed({
  filter = {},
  showSubject = true,
  /** Rendu lorsqu'il n'y a rien à lire ; absent, l'état vide générique. */
  emptyTitle,
  emptyDescription,
}: {
  filter?: ForumFilter;
  showSubject?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const t = useT();
  const { data: session } = useSession();
  const feed = useForumFeed(filter);

  const viewerId = session?.user.id ?? null;
  const canModerate = can(
    (session?.user.role ?? "user") as Role,
    "forum",
    "delete",
  );

  if (feed.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (feed.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {t.common.error}
      </p>
    );
  }

  const posts = feed.data.pages.flatMap((page) => page.data);

  if (posts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t.forum.empty}
        description={emptyDescription ?? t.forum.emptyDescription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.id}>
            <ForumPostCard
              post={post}
              viewerId={viewerId}
              canModerate={canModerate}
              showSubject={showSubject}
            />
          </li>
        ))}
      </ul>

      {feed.hasNextPage && (
        <button
          type="button"
          disabled={feed.isFetchingNextPage}
          onClick={() => void feed.fetchNextPage()}
          className="border-border hover:bg-accent/30 self-start rounded-md border px-4 py-2 text-xs font-semibold tracking-wide uppercase disabled:opacity-50"
        >
          {feed.isFetchingNextPage ? t.catalogue.loading : t.forum.loadMore}
        </button>
      )}
    </div>
  );
}
