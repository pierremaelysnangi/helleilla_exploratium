"use client";

/**
 * <BandList> — catalogue des groupes virtualisé avec chargement progressif.
 * Combine :
 * - filtres d'URL synchronisés (nuqs) : q, sort, order ;
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
import { z } from "zod";

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
  const [filters, setFilters] = useQueryStates(bandFilters);

  const infinite = useInfiniteQuery({
    queryKey: bandKeys.list({ ...filters, perPage: PER_PAGE }),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const payload = await apiJsonEnvelope("/api/bands", {
        signal,
        query: {
          page: pageParam,
          perPage: PER_PAGE,
          q: filters.q || undefined,
          sort: filters.sort,
          order: filters.order,
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
          placeholder="Rechercher un groupe…"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value || null })}
          className="border-border bg-card focus:border-primary/50 w-full max-w-xs rounded-md border px-3 py-2 text-sm outline-none"
          aria-label="Rechercher un groupe"
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as never })}
          aria-label="Trier par"
          className="border-border bg-card rounded-md border px-3 py-2 text-sm"
        >
          <option value="createdAt">Plus récents</option>
          <option value="name">Nom</option>
          <option value="year">Année</option>
        </select>
        <button
          type="button"
          onClick={() =>
            setFilters({ order: filters.order === "asc" ? "desc" : "asc" })
          }
          className="metal-nav-link border-border hover:border-primary/40 rounded-md border px-3 py-2"
          aria-label={`Ordre ${filters.order === "asc" ? "croissant" : "décroissant"}`}
        >
          {filters.order === "asc" ? "↑ Croissant" : "↓ Décroissant"}
        </button>
        {meta && (
          <span className="text-muted-foreground text-sm">
            {meta.total} groupe{meta.total > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Liste virtualisée : hauteur ~120 px estimée par carte */}
      <div className="h-[calc(100vh-320px)] min-h-[400px]">
        {infinite.isPending ? (
          <p className="text-muted-foreground">Chargement du catalogue…</p>
        ) : infinite.isError ? (
          <p role="alert" className="text-destructive">
            Impossible de charger les groupes :{" "}
            {(infinite.error as Error).message}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">
            Aucun groupe ne correspond à cette recherche.
          </p>
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
