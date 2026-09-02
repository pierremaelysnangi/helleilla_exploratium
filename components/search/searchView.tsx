"use client";

/**
 * <SearchView> — vue complète de la recherche : champ de saisie +
 * résultats groupés (debounce géré par le hook).
 *
 * Le terme est synchronisé avec l'URL (`?q=`), comme les filtres du
 * catalogue : une recherche devient partageable, revient intacte par le
 * bouton « précédent », et un lien entrant vers `/search?q=…` affiche
 * enfin ses résultats — auparavant le champ s'ouvrait vide, en ignorant
 * le paramètre.
 */

import { parseAsString, useQueryState } from "nuqs";
import { SearchResults } from "./searchResults";

export function SearchView() {
  // `throttleMs` : l'historique n'est réécrit qu'après une pause de
  // frappe, sinon chaque caractère empilerait une entrée.
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ throttleMs: 400 }),
  );

  return (
    <>
      <input
        type="search"
        autoFocus
        placeholder="Groupes, albums, pistes…"
        value={query}
        onChange={(e) => void setQuery(e.target.value || null)}
        aria-label="Terme de recherche"
        className="border-border bg-card focus:border-primary/50 w-full rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
      />
      <SearchResults q={query} />
    </>
  );
}
