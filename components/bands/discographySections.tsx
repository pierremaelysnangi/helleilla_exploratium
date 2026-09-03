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
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Ordre d'affichage : sorties principales d'abord. */
export const TYPE_ORDER: AlbumRow["type"][] = [
  "album",
  "ep",
  "split",
  "live",
  "demo",
  "compilation",
  "single",
];

/** Regroupe une discographie par type, sections vides écartées. */
export function groupByType(albums: AlbumRow[]) {
  return TYPE_ORDER.map((type) => ({
    type,
    albums: albums.filter((album) => album.type === type),
  })).filter((section) => section.albums.length > 0);
}

type DiscographySectionsProps = {
  albums: AlbumRow[];
  /** Dictionnaire : les titres de section suivent la langue du lecteur. */
  t: Dictionary;
  bandSlug: string;
  bandName: string;
  /** Visuel du groupe : repli des pochettes non archivées. */
  bandImageUrl?: string | null;
  /** Niveau de titre des sections, selon la hiérarchie de la page. */
  headingLevel?: "h2" | "h3";
};

/**
 * Nombre de cartes chargées sans attendre le défilement.
 *
 * Douze, soit deux rangées pleines à la largeur la plus dense (six
 * colonnes) : les sections sont courtes et se succèdent, si bien que le
 * Largest Contentful Paint tombe souvent dans la DEUXIÈME. Six ne
 * suffisait pas, et le navigateur le signalait encore.
 */
const EAGER_CARDS = 12;

export function DiscographySections({
  albums,
  bandSlug,
  bandName,
  bandImageUrl,
  t,
  headingLevel = "h2",
}: DiscographySectionsProps) {
  const Heading = headingLevel;

  // Rang de départ de chaque section sur la PAGE ENTIÈRE, calculé une
  // fois. La première section peut ne contenir qu'une sortie, auquel cas
  // le Largest Contentful Paint se trouve dans la suivante — une
  // priorité comptée par section le manquait.
  //
  // Cumul par `reduce` plutôt qu'un compteur incrémenté dans le rendu :
  // muter une variable pendant le rendu produit des résultats
  // dépendants de l'ordre d'évaluation de React.
  const sections = groupByType(albums).reduce<
    { type: AlbumRow["type"]; albums: AlbumRow[]; offset: number }[]
  >((acc, section) => {
    const previous = acc.at(-1);
    const offset = previous ? previous.offset + previous.albums.length : 0;
    return [...acc, { ...section, offset }];
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section
          key={section.type}
          aria-label={t.releaseSection[section.type]}
          className="flex flex-col gap-3"
        >
          <Heading className="metal-title flex items-baseline gap-2 text-base">
            {t.releaseSection[section.type]}
            <span className="text-muted-foreground font-mono text-xs">
              {section.albums.length}
            </span>
          </Heading>

          <ul className="3xl:grid-cols-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {section.albums.map((album, index) => (
              <li key={album.id}>
                <AlbumCard
                  album={album}
                  bandSlug={bandSlug}
                  bandImageUrl={bandImageUrl}
                  bandName={bandName}
                  priority={section.offset + index < EAGER_CARDS}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
