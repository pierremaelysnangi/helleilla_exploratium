"use client";

/**
 * <VirtualInfiniteList> — liste virtualisée à hauteurs dynamiques avec
 * chargement progressif (infinite scroll).
 *
 * Combine :
 * - `useVirtualList` (TanStack Virtual) : rendu des seules lignes visibles ;
 * - `useInfiniteQuery` côté appelant : `onLoadMore = fetchNextPage`.
 * Chaque ligne est mesurée réellement (`measureElement`) : les items
 * provenant d'APIs externes peuvent avoir n'importe quelle hauteur.
 */

// Hook de virtualisation + logique pure de fin de liste
import { useVirtualList, shouldLoadMore } from "@/hooks/use-virtual-list";
// Effet pour déclencher le chargement au franchissement du seuil
import { useEffect, useRef } from "react";

/** Props de la liste virtualisée. */
export type VirtualInfiniteListProps<T> = {
  /** Éléments accumulés (toutes pages confondues). */
  items: T[];
  /** Clé stable par élément (évite les recréations de DOM inutiles). */
  getItemKey: (item: T, index: number) => string | number;
  /** Estimation initiale de hauteur de ligne (corrigée par mesure). */
  estimateSize: (index: number) => number;
  /** Rendu d'une ligne ; attacher la ref fournie (mesure dynamique). */
  renderItem: (
    item: T,
    measureRef: (el: HTMLElement | null) => void,
  ) => React.ReactNode;
  /** Chargement page suivante (fetchNextPage). Optionnel : liste statique. */
  onLoadMore?: () => void;
  /** Une requête de page suivante est-elle en cours ? */
  isLoadingMore?: boolean;
  /** Y a-t-il encore des pages après la courante ? */
  hasMore?: boolean;
};

/**
 * Conteneur scrollable virtualisé. La hauteur est celle du parent CSS ;
 * prévoir `max-h-*` ou une hauteur fixe sur le conteneur.
 */
export function VirtualInfiniteList<T>({
  items,
  getItemKey,
  estimateSize,
  renderItem,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
}: VirtualInfiniteListProps<T>) {
  const { parentRef, virtualizer } = useVirtualList({
    count: items.length,
    estimateSize,
    getItemKey: (index: number) => getItemKey(items[index] as T, index),
    // Déclenchement du chargement à chaque mise à jour de plage visible
    onChange: () => {
      if (!hasMore || !onLoadMore || loadingRef.current) return;
      if (
        shouldLoadMore(
          virtualizer.scrollOffset ?? 0,
          virtualizer.getTotalSize(),
          parentRef.current?.clientHeight ?? 0,
        )
      ) {
        onLoadMore();
      }
    },
  });

  // Anti-rebond : ne pas re-déclencher pendant un fetch en cours
  const loadingRef = useRef(false);
  useEffect(() => {
    loadingRef.current = isLoadingMore;
  }, [isLoadingMore]);

  return (
    <div ref={parentRef} style={{ overflowY: "auto", height: "100%" }}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement} // mesure dynamique de la ligne
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], () => undefined)}
          </div>
        ))}
      </div>
      {hasMore && isLoadingMore && <p>Chargement…</p>}
    </div>
  );
}
