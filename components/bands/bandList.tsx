"use client";

/**
 * <BandList> — catalogue des groupes virtualisé avec chargement progressif.
 * Combine :
 * - filtres d'URL synchronisés (nuqs) : q, genre, sort, order ;
 * - `useInfiniteQuery` (TanStack Query) sur GET /api/bands paginé ;
 * - `<VirtualInfiniteList>` : seules les lignes visibles sont rendues,
 *   hauteurs dynamiques mesurées (bios longues ou absentes).
 */

// Filtres typés synchronisés avec l'URL
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
// Infinite query TanStack + client HTTP navigateur
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiJsonEnvelope } from "@/hooks/api/client";
import { bandKeys } from "@/hooks/api/queryKeys";
import {
  bandRowSchema,
  type BandRow,
  type PaginationMeta,
} from "@/hooks/api/schemas";
// Virtualisation à hauteurs dynamiques
import { VirtualInfiniteList } from "@/components/shared/virtualInfiniteList";
// Carte de groupe
import { BandCard } from "./bandCard";
// Filtre par genre partagé (inclusif des sous-genres)
import { GenreSelect } from "@/components/genres/genreSelect";
import { z } from "zod";
import { useI18n, usePlural } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

/** Schéma du payload paginé renvoyé par l'API (validation runtime). */
const pageSchema = z.object({
  data: z.array(bandRowSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

/** Filtres synchronisés à l'URL (?q=&sort=&order=). */
export const bandFilters = {
  q: parseAsString.withDefault(""),
  /** Slug de genre ; vide = toute la taxonomie. */
  genre: parseAsString.withDefault(""),
  sort: parseAsStringEnum(["name", "createdAt", "year"]).withDefault(
    "createdAt",
  ),
  order: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
};

/** Taille de page API (20 lignes). */
const PER_PAGE = 20;

/**
 * Liste virtualisée des groupes.
 * Les filtres changent -> nouvelle clé de requête -> reset propre des pages.
 */
export function BandList() {
  const { t, locale } = useI18n();
  const n = usePlural();
  const [filters, setFilters] = useQueryStates(bandFilters);

  const infinite = useInfiniteQuery({
    // La langue entre dans la clé : changer de langue doit recharger les
    // biographies, pas resservir celles de la précédente.
    queryKey: bandKeys.list({ ...filters, perPage: PER_PAGE, locale }),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const payload = await apiJsonEnvelope("/api/bands", {
        signal,
        query: {
          page: pageParam,
          perPage: PER_PAGE,
          q: filters.q || undefined,
          genre: filters.genre || undefined,
          sort: filters.sort,
          order: filters.order,
          locale,
        },
      });
      return pageSchema.parse(payload);
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });

  // Aplatissage des pages pour la liste virtualisée
  const rows: BandRow[] =
    infinite.data?.pages.flatMap((page) => page.data) ?? [];
  const meta: PaginationMeta | undefined = infinite.data?.pages.at(-1)?.meta;

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder={t.catalogue.searchBand}
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value || null })}
          className="border-border bg-card focus:border-primary/50 w-full max-w-xs rounded-md border px-3 py-2 text-sm outline-none"
          aria-label={t.catalogue.searchBand}
        />
        <GenreSelect
          value={filters.genre}
          onChange={(genre) => setFilters({ genre: genre || null })}
          label={t.catalogue.filterByGenre}
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as never })}
          aria-label={t.catalogue.sortBy}
          className="border-border bg-card rounded-md border px-3 py-2 text-sm"
        >
          <option value="createdAt">{t.catalogue.newest}</option>
          <option value="name">{t.catalogue.name}</option>
          <option value="year">{t.catalogue.year}</option>
        </select>
        <button
          type="button"
          onClick={() =>
            setFilters({ order: filters.order === "asc" ? "desc" : "asc" })
          }
          className="metal-nav-link border-border hover:border-primary/40 rounded-md border px-3 py-2"
          aria-label={
            filters.order === "asc"
              ? t.catalogue.ascending
              : t.catalogue.descending
          }
        >
          {filters.order === "asc"
            ? `↑ ${t.catalogue.ascending}`
            : `↓ ${t.catalogue.descending}`}
        </button>
        {meta && (
          <span className="text-muted-foreground text-sm">
            {n(t.count.bands, meta.total)}
          </span>
        )}
      </div>

      {/* Liste virtualisée : hauteur ~120 px estimée par carte */}
      <div className="h-[calc(100vh-320px)] min-h-[400px]">
        {infinite.isPending ? (
          <p className="text-muted-foreground">{t.catalogue.loading}</p>
        ) : infinite.isError ? (
          <p role="alert" className="text-destructive">
            {interpolate(t.catalogue.bandsLoadFailed, {
              reason: (infinite.error as Error).message,
            })}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">{t.catalogue.noResult}</p>
        ) : (
          <VirtualInfiniteList
            items={rows}
            getItemKey={(band) => band.id}
            estimateSize={() => 120}
            renderItem={(band) => (
              <div className="py-1.5">
                <BandCard band={band} />
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
