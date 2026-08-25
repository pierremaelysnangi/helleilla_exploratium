"use client";

/**
 * Wrapper TanStack Virtual pour les listes à hauteurs dynamiques.
 * Le terme clé est la **virtualisation** : seuls les éléments visibles
 * (+ un dépassement d'overscan) sont montés dans le DOM, indispensable
 * quand le contenu provient d'APIs externes de taille variable
 * (bios longues, pochettes, embeds…).
 *
 * `measureElement` mesure chaque ligne réellement rendue : pas besoin
 * d'estimer précisément, l'estimation initiale est corrigée au rendu.
 */

// Primitives TanStack Virtual (déjà installé)
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

/** Options du hook de virtualisation. */
type UseVirtualListOptions = {
  /** Nombre total d'éléments (items.length, croît avec l'infinite scroll). */
  count: number;
  /** Estimation initiale de hauteur par élément (corrigée par mesure réelle). */
  estimateSize: (index: number) => number;
  /** Lignes rendues au-delà du viewport pour un défilement fluide. */
  overscan?: number;
  /** Clé stable par index (évite les remontées d'état entre lignes). */
  getItemKey?: (index: number) => string | number;
  /**
   * Callback appelé à chaque changement d'état du virtualiseur
   * (scroll, mesure, plage visible) ; `sync` = appel synchrone au scroll.
   */
  onChange?: (
    instance: Virtualizer<HTMLDivElement, Element>,
    sync: boolean,
  ) => void;
};

/** Retour du hook : ref du conteneur scrollable + virtualiseur configuré. */
export function useVirtualList(options: UseVirtualListOptions): {
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
} {
  const parentRef = useRef<HTMLDivElement>(null);

  // API TanStack Virtual v3 : le compilateur React ignore ce hook par
  // conception (les fonctions retournées sont volontairement non-
  // mémorisables), comportement documenté par la librairie.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: options.count,
    getScrollElement: () => parentRef.current,
    estimateSize: options.estimateSize,
    overscan: options.overscan ?? 6,
    getItemKey: options.getItemKey,
    // API TanStack Virtual v3 : le callback vit dans les options
    onChange: options.onChange,
  });

  return { parentRef, virtualizer };
}

/**
 * Logique pure de déclenchement du chargement page suivante :
 * vrai quand il reste moins de `thresholdPx` avant la fin du contenu.
 * Exposée séparément pour être testée sans DOM réel.
 *
 * @param scrollOffset - Position courante de défilement (px).
 * @param totalSize - Hauteur totale du contenu virtualisé (px).
 * @param viewportHeight - Hauteur visible du conteneur (px).
 * @param thresholdPx - Marge de déclenchement (défaut 400 px).
 */
export function shouldLoadMore(
  scrollOffset: number,
  totalSize: number,
  viewportHeight: number,
  thresholdPx = 400,
): boolean {
  if (totalSize <= viewportHeight) return true; // tout est visible
  return scrollOffset + viewportHeight >= totalSize - thresholdPx;
}
