/**
 * Page de recherche (/search) — champ + résultats groupés par type
 * (groupes, albums, pistes). La palette Ctrl+K est montée séparément
 * dans le layout racine.
 */

import type { Metadata } from "next";
import { SearchView } from "@/components/search/searchView";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    // La recherche est une interface, pas du contenu indexable
    robots: { index: false },
    title: t.nav.search,
    description: t.meta.searchDescription,
  };
}

export default async function SearchPage() {
  const { t } = await getTranslations();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="metal-title text-2xl">{t.nav.search}</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <SearchView />
    </div>
  );
}
