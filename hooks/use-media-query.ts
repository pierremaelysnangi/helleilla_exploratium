"use client";

/**
 * Hook `useMediaQuery` — s'abonne à une media query CSS.
 *
 * Utilise `useSyncExternalStore` plutôt qu'un `useState` + `useEffect` :
 * le rendu serveur reçoit ainsi explicitement `false` via le snapshot
 * serveur, ce qui évite l'écart d'hydratation qu'un état initial deviné
 * côté client produirait.
 */

import { useCallback, useSyncExternalStore } from "react";

/**
 * @param query - Media query CSS, ex. `(max-width: 768px)`.
 * @returns `true` si la requête est satisfaite ; `false` au rendu serveur.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Snapshot serveur : aucune media query n'est évaluable sans navigateur
    () => false,
  );
}
