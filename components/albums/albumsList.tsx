"use client";

/**
 * <AlbumsList> — catalogue des albums virtualisé (même mécanique que
 * BandList) : infinite query + filtres URL. Chaque album renvoie vers
 * la page de son groupe (le slug album est unique par groupe, pas
 * globalement).
 */

// Filtres URL + infinite query
import { parseAsString, useQueryStates } from "nuqs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiJsonEnvelope } from "@/hooks/api/client";
import { albumKeys } from "@/hooks/api/queryKeys";
import { albumListItemSchema, type AlbumListItem } from "@/hooks/api/schemas";
import { GenreSelect } from "@/components/genres/genreSelect";
import { VirtualInfiniteList } from "@/components/shared/virtualInfiniteList";
import Link from "next/link";
import { CoverImage } from "./coverImage";

/** Libellés français du type de sortie (enum PostgreSQL `album_type`). */
const TYPE_LABELS: Record<AlbumListItem["type"], string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  compilation: "Compilation",
  live: "Live",
  demo: "Démo",
};

const pageSchema = z.object({
  data: z.array(albumListItemSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

export function AlbumsList() {
  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(""),
    genre: parseAsString.withDefault(""),
  });

  const infinite = useInfiniteQuery({
    queryKey: albumKeys.list({ ...filters, perPage: 20 }),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const payload = await apiJsonEnvelope("/api/albums", {
        signal,
        query: {
          page: pageParam,
          perPage: 20,
          q: filters.q || undefined,
          genre: filters.genre || undefined,
          sort: "year",
          order: "desc",
        },
      });
      return pageSchema.parse(payload);
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const rows: AlbumListItem[] =
    infinite.data?.pages.flatMap((page) => page.data) ?? [];
  const total = infinite.data?.pages.at(-1)?.meta.total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Rechercher un album…"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value || null })}
          aria-label="Rechercher un album"
          className="border-border bg-card focus:border-primary/50 w-full max-w-xs rounded-md border px-3 py-2 text-sm outline-none"
        />
        <GenreSelect
          value={filters.genre}
          onChange={(genre) => setFilters({ genre: genre || null })}
          label="Filtrer les albums par genre"
        />
        {total !== undefined && (
          <span className="text-muted-foreground text-sm">
            {total} sortie{total > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="h-[calc(100vh-320px)] min-h-[400px]">
        {infinite.isPending ? (
          <p className="text-muted-foreground">Chargement des albums…</p>
        ) : infinite.isError ? (
          <p role="alert" className="text-destructive text-sm">
            Impossible de charger les albums.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">Aucun album trouvé.</p>
        ) : (
          <VirtualInfiniteList
            items={rows}
            getItemKey={(album) => album.id}
            estimateSize={() => 96}
            renderItem={(album) => (
              <div className="py-1">
                <AlbumRowCard album={album} />
              </div>
            )}
            hasMore={infinite.hasNextPage}
            isLoadingMore={infinite.isFetchingNextPage}
            onLoadMore={() => void infinite.fetchNextPage()}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Ligne d'album du catalogue : pochette, titre, groupe, année et type.
 *
 * La liste est virtualisée à hauteur fixe, donc les cartes carrées de
 * <AlbumCard> (utilisées dans les grilles) ne conviennent pas ici : on
 * reprend la même information dans une ligne, pochette comprise.
 */
function AlbumRowCard({ album }: { album: AlbumListItem }) {
  return (
    <Link
      href={`/bands/${album.band.slug}/albums/${album.slug}`}
      className="metal-card hover:bg-accent/30 flex items-center gap-4 p-3 transition-colors"
    >
      <span className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
        <CoverImage src={album.coverUrl} title={album.title} sizes="64px" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {album.title}
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {album.band.name}
        </span>
      </span>
      <span className="text-muted-foreground shrink-0 font-mono text-sm">
        {album.releaseYear ?? "—"}
      </span>
      <span className="border-border text-muted-foreground shrink-0 rounded border px-2 py-0.5 text-xs tracking-wide uppercase">
        {TYPE_LABELS[album.type]}
      </span>
    </Link>
  );
}
