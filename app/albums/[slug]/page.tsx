/**
 * Résolveur de l'URL héritée `/albums/[slug]` — Server Component.
 *
 * Cette adresse ne peut pas désigner un album de façon fiable : la
 * contrainte `albums_band_slug_uq` ne rend le slug unique qu'au sein d'un
 * groupe, donc deux groupes peuvent avoir un « live » ou une « demo ».
 * Plutôt que d'afficher un album arbitraire, la page résout :
 *
 * - aucun résultat  -> 404 ;
 * - un seul         -> redirection vers l'URL canonique band-scopée ;
 * - plusieurs       -> page de levée d'ambiguïté.
 *
 * La redirection est TEMPORAIRE à dessein : un second groupe peut publier
 * un album homonyme plus tard, et un 308 resterait en cache côté client et
 * moteurs alors que l'URL devrait redevenir une page de choix.
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
// Lecture directe : la désambiguïsation n'est pas une ressource publique
import { listAlbumsBySlugWithBand } from "@/db/queries/albums";
import { getTranslations } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/format";

type AlbumsSlugPageProps = {
  params: Promise<{ slug: string }>;
};

/** Page technique de redirection : jamais indexée. */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t.releaseType.album,
    robots: { index: false, follow: true },
  };
}

export default async function AlbumsSlugPage({ params }: AlbumsSlugPageProps) {
  const { slug } = await params;
  const [matches, { t }] = await Promise.all([
    listAlbumsBySlugWithBand(slug),
    getTranslations(),
  ]);

  if (matches.length === 0) notFound();

  // Cas nominal : un seul album porte ce slug -> URL canonique
  if (matches.length === 1) {
    const only = matches[0]!;
    redirect(`/bands/${only.bandSlug}/albums/${only.slug}`);
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="metal-title text-2xl">
          {interpolate(t.album.ambiguousTitle, { slug })}
        </h1>
        <div className="metal-rule mt-2 w-40" />
        {/* Le nombre de groupes n'est pas répété : la liste est juste
            en dessous, et un compteur inséré dans la phrase imposait un
            accord que le polonais et le russe ne peuvent pas tenir. */}
        <p className="text-muted-foreground mt-3 text-sm">
          {t.album.ambiguousLead}
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {matches.map((album) => (
          <li key={album.id}>
            <Link
              href={`/bands/${album.bandSlug}/albums/${album.slug}`}
              className="metal-card hover:bg-accent/30 flex items-center gap-3 px-4 py-3"
            >
              <span className="text-muted-foreground w-12 shrink-0 font-mono text-sm">
                {album.releaseYear ?? t.band.unknownYear}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {album.title}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {album.bandName}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
