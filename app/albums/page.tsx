/**
 * Page listant les albums (/albums) — catalogue virtualisé trié par
 * année avec recherche par titre.
 */

import type { Metadata } from "next";
import { AlbumsList } from "@/components/albums/albumsList";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.nav.albums, description: t.meta.albumsDescription };
}

export default async function AlbumsPage() {
  const { t } = await getTranslations();
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="metal-title text-2xl">{t.nav.albums}</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <AlbumsList />
    </div>
  );
}
