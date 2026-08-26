/**
 * Page de recherche (/search) — champ + résultats groupés par type
 * (groupes, albums, pistes). La palette Ctrl+K est montée séparément
 * dans le layout racine.
 */

import type { Metadata } from "next";
import { SearchView } from "@/components/search/searchView";

export const metadata: Metadata = {
  // La recherche est une interface, pas du contenu indexable
  robots: { index: false },
  title: "Recherche",
  description:
    "Recherchez parmi les groupes, albums et pistes du catalogue metal.",
};

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="metal-title text-2xl">Recherche</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <SearchView />
    </div>
  );
}
