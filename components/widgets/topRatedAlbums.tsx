/**
 * <TopRatedAlbums> — albums les mieux notés par la communauté.
 *
 * Le nombre de votes est TOUJOURS affiché à côté de la moyenne : une note
 * sans son effectif laisse croire à un consensus qui n'existe peut-être
 * pas. Le widget disparaît tant qu'aucun album n'atteint le seuil de votes,
 * plutôt que d'exhiber un classement bâti sur deux avis.
 */

import Link from "next/link";

/** Ligne de classement telle que renvoyée par `listTopRatedAlbums`. */
export type TopRatedAlbum = {
  id: string;
  title: string;
  slug: string;
  bandSlug: string;
  bandName: string;
  releaseYear: number | null;
  average: string | null;
  votes: number;
};

export function TopRatedAlbums({ albums }: { albums: TopRatedAlbum[] }) {
  if (albums.length === 0) return null;

  return (
    <section aria-labelledby="mieux-notes" className="flex flex-col gap-3">
      <h2 id="mieux-notes" className="metal-title text-lg">
        Les mieux notés
      </h2>
      <ol className="divide-border border-border divide-y rounded-lg border">
        {albums.map((album, index) => (
          <li key={album.id} className="bg-card">
            <Link
              href={`/bands/${album.bandSlug}/albums/${album.slug}`}
              className="hover:bg-accent/30 flex items-center gap-3 px-4 py-2.5 transition-colors"
            >
              <span className="text-muted-foreground w-5 shrink-0 text-right font-mono text-sm">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {album.title}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {album.bandName}
                  {album.releaseYear ? ` · ${album.releaseYear}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-sm">
                  {album.average
                    ? `${Math.round(Number(album.average) * 10) / 10}/5`
                    : "—"}
                </span>
                {/* L'effectif conditionne la lecture de la moyenne */}
                <span className="text-muted-foreground block text-xs">
                  {album.votes} vote{album.votes > 1 ? "s" : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
