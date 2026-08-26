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
import { albumRowSchema, type AlbumRow } from "@/hooks/api/schemas";
import { VirtualInfiniteList } from "@/components/shared/virtualInfiniteList";

const pageSchema = z.object({
  data: z.array(albumRowSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

/** Libellés du type de sortie. */
const TYPE_LABELS = {
  album: "Album",
  ep: "EP",
  single: "Single",
  compilation: "Compilation",
  live: "Live",
  demo: "Démo",
} as const;

export function AlbumsList() {
  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(""),
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
          sort: "year",
          order: "desc",
        },
      });
      return pageSchema.parse(payload);
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const rows: AlbumRow[] =
    infinite.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        placeholder="Rechercher un album…"
        value={filters.q}
        onChange={(e) => setFilters({ q: e.target.value || null })}
        aria-label="Rechercher un album"
        className="border-border bg-card focus:border-primary/50 w-full max-w-xs rounded-md border px-3 py-2 text-sm outline-none"
      />

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
            estimateSize={() => 80}
            renderItem={(album) => (
              <div className="py-1">
                {/* Ligne compacte : année, titre, type */}
                <div className="metal-card flex items-center gap-3 px-4 py-3">
                  <span className="text-muted-foreground w-12 font-mono text-sm">
                    {album.releaseYear ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {album.title}
                  </span>
                  <span className="border-border text-muted-foreground rounded border px-2 py-0.5 text-xs tracking-wide uppercase">
                    {TYPE_LABELS[album.type]}
                  </span>
                </div>
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
