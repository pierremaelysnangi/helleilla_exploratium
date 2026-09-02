/**
 * <GenreCard> — carte d'un genre pour les grilles (/genres, sous-genres).
 * Composant serveur : pas d'état, uniquement un lien.
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
      className="metal-card hover:bg-accent/30 block px-4 py-3 text-center"
    >
      <span className="block text-sm font-semibold tracking-wide uppercase">
        {genre.name}
      </span>
      {bandCount !== undefined && (
        <span className="text-muted-foreground mt-1 block text-xs">
          {bandCount} {bandCount > 1 ? "groupes" : "groupe"}
        </span>
      )}
    </Link>
  );
}
