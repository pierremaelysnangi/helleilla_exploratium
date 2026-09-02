/**
 * <RecentAlbums> — dernières sorties ajoutées au catalogue.
 *
 * Server Component : les données arrivent déjà lues par la page, il n'y a
 * ni requête client ni état. Le lien est band-scopé, seule adresse non
 * ambiguë d'un album.
 */

import { AlbumCard } from "@/components/albums/albumCard";
import type { AlbumRow } from "@/hooks/api/schemas";

/** Album accompagné du slug de son groupe. */
export type AlbumWithBand = AlbumRow & {
  bandSlug: string;
  bandName: string;
};

export function RecentAlbums({ albums }: { albums: AlbumWithBand[] }) {
  if (albums.length === 0) return null;

  return (
    <section aria-labelledby="derniers-albums" className="flex flex-col gap-3">
      <h2 id="derniers-albums" className="metal-title text-lg">
        Dernières sorties référencées
      </h2>
      <ul className="3xl:grid-cols-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {albums.map((album) => (
          <li key={album.id}>
            <AlbumCard album={album} bandSlug={album.bandSlug} />
          </li>
        ))}
      </ul>
    </section>
  );
}
