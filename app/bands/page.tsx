/**
 * Page listant les groupes (/bands) — catalogue virtualisé avec filtres
 * d'URL synchronisés et chargement progressif.
 */

import type { Metadata } from "next";
import { BandList } from "@/components/bands/bandList";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.nav.bands, description: t.meta.bandsDescription };
}

export default async function BandsPage() {
  const { t } = await getTranslations();
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="metal-title text-2xl">{t.nav.bands}</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <BandList />
    </div>
  );
}
