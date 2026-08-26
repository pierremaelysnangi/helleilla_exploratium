"use client";

/**
 * <SearchView> — vue complète de la recherche : champ de saisie +
 * résultats groupés (état partagé local, debounce géré par le hook).
 */

// État du terme saisi
import { useState } from "react";
import { SearchResults } from "./searchResults";

export function SearchView() {
  const [query, setQuery] = useState("");

  return (
    <>
      <input
        type="search"
        autoFocus
        placeholder="Groupes, albums, pistes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Terme de recherche"
        className="border-border bg-card focus:border-primary/50 w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
      />
      <SearchResults q={query} />
    </>
  );
}
