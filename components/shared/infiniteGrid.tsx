"use client";

/**
 * <InfiniteGrid> — grille responsive à chargement progressif.
 *
 * Pendant de <VirtualInfiniteList> pour les contenus en CARTES. La
 * virtualisation y serait à contre-emploi : elle suppose des lignes
 * empilées, alors qu'une grille change de nombre de colonnes à chaque
 * palier de largeur, du smartphone au 4K.
 *
 * Le coût de rendu hors écran est confié au navigateur via
 * `content-visibility`, et la page suivante est demandée par un
 * observateur d'intersection plutôt que par un calcul de position —
 * moins de code, et un comportement correct quand la page elle-même
 * défile (pas de conteneur à hauteur fixe).
 */

import { useEffect, useRef } from "react";

export type InfiniteGridProps<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string | number;
  renderItem: (item: T) => React.ReactNode;
  /** Classes de grille ; permet d'ajuster les paliers par contexte. */
  className?: string;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
};

/** Paliers par défaut : 2 colonnes sur smartphone, 8 en 4K. */
const DEFAULT_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 3xl:grid-cols-8";

export function InfiniteGrid<T>({
  items,
  getItemKey,
  renderItem,
  className = DEFAULT_GRID,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
}: InfiniteGridProps<T>) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !onLoadMore || !hasMore || isLoadingMore) return;

    // `rootMargin` : la page suivante part avant que la sentinelle soit
    // visible, pour que le défilement ne marque pas de pause.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  return (
    <div className="flex flex-col gap-4">
      <ul className={className}>
        {items.map((item, index) => (
          <li
            key={getItemKey(item, index)}
            // `contain-intrinsic-size` évite que la barre de défilement
            // saute pendant que le navigateur rend les cartes hors écran.
            className="[contain-intrinsic-size:auto_260px] [content-visibility:auto]"
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>

      <div ref={sentinel} aria-hidden className="h-px" />

      {isLoadingMore && (
        <p role="status" className="text-muted-foreground text-center text-sm">
          Chargement…
        </p>
      )}
    </div>
  );
}
