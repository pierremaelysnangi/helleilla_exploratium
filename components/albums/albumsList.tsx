"use client";

/**
 * <AlbumsList> — catalogue des albums en grille de cartes.
 *
 * Filtres synchronisés à l'URL (recherche, genre) et chargement
 * progressif. La grille remplace la liste virtualisée : une pochette se
 * lit d'un coup d'œil, une ligne de texte non — et le nombre de colonnes
 * s'adapte du smartphone au 4K, ce qu'une virtualisation par lignes ne
 * sait pas faire proprement.
 *
 * Chaque carte renvoie vers l'URL band-scopée de l'album, la seule qui
 * le désigne sans ambiguïté (son slug n'est unique qu'au sein du groupe).
 */

// Filtres URL + infinite query
import { parseAsString, useQueryStates } from "nuqs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiJsonEnvelope } from "@/hooks/api/client";
import { albumKeys } from "@/hooks/api/queryKeys";
import { albumListItemSchema, type AlbumListItem } from "@/hooks/api/schemas";
import { GenreSelect } from "@/components/genres/genreSelect";
import { InfiniteGrid } from "@/components/shared/infiniteGrid";
import { AlbumCard } from "./albumCard";

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

      {infinite.isPending ? (
        <p className="text-muted-foreground">Chargement des albums…</p>
      ) : infinite.isError ? (
        <p role="alert" className="text-destructive text-sm">
          Impossible de charger les albums.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">Aucun album trouvé.</p>
      ) : (
        <InfiniteGrid
          items={rows}
          getItemKey={(album) => album.id}
          renderItem={(album) => (
            <AlbumCard
              album={album}
              bandSlug={album.band.slug}
              bandName={album.band.name}
              bandImageUrl={album.band.imageUrl}
            />
          )}
          hasMore={infinite.hasNextPage}
          isLoadingMore={infinite.isFetchingNextPage}
          onLoadMore={() => void infinite.fetchNextPage()}
        />
      )}
    </div>
  );
}
