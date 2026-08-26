/**
 * Page listant les albums (/albums) — catalogue virtualisé trié par
 * année avec recherche par titre.
 */

import type { Metadata } from "next";
import { AlbumsList } from "@/components/albums/albumsList";

export const metadata: Metadata = {
  title: "Albums",
  description: "Catalogue des albums, EP, singles et démos du monde metal.",
};

export default function AlbumsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="metal-title text-2xl">Albums</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <AlbumsList />
    </div>
  );
}
