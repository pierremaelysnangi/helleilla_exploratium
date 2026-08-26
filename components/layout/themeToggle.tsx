"use client";

/**
 * <ThemeToggle> — bascule clair/sombre (next-themes).
 * Icône soleil/lune selon le thème courant ; montage différé pour éviter
 * tout mismatch d'hydratation (le thème est résolu côté client).
 */

// Hook next-themes + détection de montage sans effet (compatible compiler)
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

/** Détecte le montage client sans setState dans un effet. */
const emptySubscribe = () => () => undefined;
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true, // snapshot client : monté
    () => false, // snapshot serveur : non monté
  );

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="metal-nav-link border-border hover:border-primary/40 rounded-md border px-2 py-1"
    >
      {/* Rendu neutre avant montage : évite l'écart d'hydratation */}
      {mounted ? (isDark ? "☀" : "☾") : "☾"}
    </button>
  );
}
