/**
 * <GenreCard> — carte d'un genre pour les grilles (/genres, sous-genres).
 * Composant serveur : pas d'état, uniquement un lien.
 *
 * Toutes les cartes ont la MÊME hauteur : la longueur des noms de genres
 * varie du simple au quintuple, et une grille à hauteur libre s'alignait
 * en escalier.
 *
 * Pointe vers la page du genre (`/genres/[slug]`), le slug de genre étant
 * unique globalement — contrairement aux albums qui exigent leur groupe.
 */

// Lien Next
import Link from "next/link";
// Résumé { id, name, slug } partagé par les réponses détail
import type { GenreSummary } from "@/hooks/api/schemas";

type GenreCardProps = {
  genre: GenreSummary;
  /** Nombre de groupes rattachés, affiché s'il est connu. */
  bandCount?: number;
};

export function GenreCard({ genre, bandCount }: GenreCardProps) {
  return (
    <Link
      href={`/genres/${genre.slug}`}
      // Hauteur fixe et texte centré sur deux lignes au plus : les noms
      // de genres vont de « Djent » à « Technical Progressive Metal », et
      // des cartes à hauteur libre produisaient une grille en escalier.
      className="metal-card hover:bg-accent/30 flex h-24 flex-col items-center justify-center gap-1 px-3 text-center"
    >
      <span className="line-clamp-2 text-sm font-semibold tracking-wide uppercase">
        {genre.name}
      </span>
      {bandCount !== undefined && (
        <span className="text-muted-foreground text-xs">
          {bandCount} {bandCount > 1 ? "groupes" : "groupe"}
        </span>
      )}
    </Link>
  );
}
