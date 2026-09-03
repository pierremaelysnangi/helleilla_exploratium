/**
 * Page des genres (/genres) — taxonomie filtrable ; chaque genre renvoie
 * vers le catalogue de groupes filtré.
 */

import type { Metadata } from "next";
import { GenresView } from "@/components/genres/genresView";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.nav.genres, description: t.meta.genresDescription };
}

export default async function GenresPage() {
  const { t } = await getTranslations();
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="metal-title text-2xl">{t.nav.genres}</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <GenresView />
    </div>
  );
}
