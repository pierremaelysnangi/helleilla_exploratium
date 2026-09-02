/**
 * <DiscographySections> — discographie d'un groupe en cartes, groupées
 * par type de sortie.
 *
 * Server Component : une grille de liens, sans état. Elle remplace le
 * tableau dépliable de la fiche groupe, dont les lignes de texte se
 * parcouraient mal passé une dizaine de sorties — et un catalogue
 * complet en compte plusieurs dizaines. Une pochette se reconnaît d'un
 * coup d'œil ; la tracklist vit sur la page de l'album.
 *
 * Une seule implémentation pour les deux vues qui en ont besoin (section
 * de la fiche et page `/discography`), afin qu'elles ne divergent pas.
 */

import { AlbumCard } from "@/components/albums/albumCard";
import type { AlbumRow } from "@/hooks/api/schemas";

/** Ordre d'affichage : sorties principales d'abord. */
export const TYPE_ORDER: AlbumRow["type"][] = [
  "album",
  "ep",
  "live",
  "demo",
  "compilation",
  "single",
];

/** Titres de section par type de sortie. */
export const TYPE_SECTIONS: Record<AlbumRow["type"], string> = {
  album: "Albums studio",
  ep: "EP",
  single: "Singles",
  live: "Live",
  compilation: "Compilations",
  demo: "Démos",
};

/** Regroupe une discographie par type, sections vides écartées. */
export function groupByType(albums: AlbumRow[]) {
  return TYPE_ORDER.map((type) => ({
    type,
    albums: albums.filter((album) => album.type === type),
  })).filter((section) => section.albums.length > 0);
}

type DiscographySectionsProps = {
  albums: AlbumRow[];
  bandSlug: string;
  bandName: string;
  /** Visuel du groupe : repli des pochettes non archivées. */
  bandImageUrl?: string | null;
  /** Niveau de titre des sections, selon la hiérarchie de la page. */
  headingLevel?: "h2" | "h3";
};

export function DiscographySections({
  albums,
  bandSlug,
  bandName,
  bandImageUrl,
  headingLevel = "h2",
}: DiscographySectionsProps) {
  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-8">
      {groupByType(albums).map((section) => (
        <section
          key={section.type}
          aria-label={TYPE_SECTIONS[section.type]}
          className="flex flex-col gap-3"
        >
          <Heading className="metal-title flex items-baseline gap-2 text-base">
            {TYPE_SECTIONS[section.type]}
            <span className="text-muted-foreground font-mono text-xs">
              {section.albums.length}
            </span>
          </Heading>

          <ul className="3xl:grid-cols-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {section.albums.map((album) => (
              <li key={album.id}>
                <AlbumCard
                  album={album}
                  bandSlug={bandSlug}
                  bandImageUrl={bandImageUrl}
                  bandName={bandName}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
