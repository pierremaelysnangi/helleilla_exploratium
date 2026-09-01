/**
 * Page détail d'un album — Server Component.
 *
 * URL canonique band-scopée (`/bands/[slug]/albums/[albumSlug]`) : le slug
 * d'album n'étant unique qu'au sein d'un groupe, c'est la seule adresse qui
 * désigne un album sans ambiguïté. `/albums/[slug]` ne sert qu'à rediriger
 * ici (voir app/albums/[slug]/page.tsx).
 *
 * SEO : metadata dynamique (canonical + OpenGraph) et données structurées
 * schema.org `MusicAlbum`.
 */

// Récupération RSC + 404 Next
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
// Fetch serveur par slugs
import { fetchAlbumBySlug } from "@/hooks/use-albums";
// Type du détail validé
import type { AlbumDetail } from "@/hooks/api/schemas";

type AlbumPageProps = {
  params: Promise<{ slug: string; albumSlug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Libellés français du type de sortie. */
const TYPE_LABELS: Record<AlbumDetail["type"], string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  compilation: "Compilation",
  live: "Live",
  demo: "Démo",
};

/** Formate une durée en minutes:secondes. */
function formatDuration(ms?: number | null): string {
  if (ms === null || ms === undefined) return "—";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Durée cumulée de la tracklist, au format ISO 8601 pour schema.org. */
function totalDurationIso(tracks: AlbumDetail["tracks"]): string | null {
  const total = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  if (total === 0) return null;
  const minutes = Math.floor(total / 60000);
  const seconds = Math.round((total % 60000) / 1000);
  return `PT${minutes}M${seconds}S`;
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { slug, albumSlug } = await params;
  const album = await fetchAlbumBySlug(slug, albumSlug);
  if (!album) return { title: "Album introuvable", robots: { index: false } };

  const title = `${album.title} — ${album.band.name}`;
  const description = `${TYPE_LABELS[album.type]} de ${album.band.name}${
    album.releaseYear ? ` sorti en ${album.releaseYear}` : ""
  }, tracklist et sources officielles.`;

  return {
    title,
    description,
    alternates: { canonical: `/bands/${album.band.slug}/albums/${album.slug}` },
    openGraph: {
      type: "music.album",
      title,
      description,
      url: `${BASE_URL}/bands/${album.band.slug}/albums/${album.slug}`,
      ...(album.coverUrl ? { images: [album.coverUrl] } : {}),
    },
  };
}

/**
 * Données structurées schema.org `MusicAlbum`, vocabulaire aligné sur les
 * rich results musique de Google.
 */
function buildMusicAlbumJsonLd(album: AlbumDetail) {
  const duration = totalDurationIso(album.tracks);
  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    url: `${BASE_URL}/bands/${album.band.slug}/albums/${album.slug}`,
    byArtist: {
      "@type": "MusicGroup",
      name: album.band.name,
      url: `${BASE_URL}/bands/${album.band.slug}`,
    },
    ...(album.coverUrl ? { image: album.coverUrl } : {}),
    ...(album.releaseDate ? { datePublished: album.releaseDate } : {}),
    ...(duration ? { duration } : {}),
    ...(album.tracks.length > 0
      ? {
          numTracks: album.tracks.length,
          track: album.tracks.map((t) => ({
            "@type": "MusicRecording",
            name: t.title,
            position: t.trackNumber,
          })),
        }
      : {}),
  };
}

export default async function AlbumDetailPage({ params }: AlbumPageProps) {
  const { slug, albumSlug } = await params;
  const album = await fetchAlbumBySlug(slug, albumSlug);

  if (!album) notFound();

  return (
    <article className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildMusicAlbumJsonLd(album)),
        }}
      />

      {/* Fil d'Ariane : l'album n'existe que dans son groupe */}
      <nav aria-label="Fil d'Ariane" className="text-muted-foreground text-sm">
        <Link href="/bands" className="hover:text-foreground">
          Groupes
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/bands/${album.band.slug}`}
          className="hover:text-foreground"
        >
          {album.band.name}
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{album.title}</span>
      </nav>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {album.coverUrl ? (
          <Image
            src={album.coverUrl}
            alt={`Pochette de ${album.title}`}
            width={224}
            height={224}
            priority
            className="border-border h-56 w-56 rounded-lg border object-cover"
          />
        ) : (
          <span className="metal-title border-border bg-muted flex h-56 w-56 shrink-0 items-center justify-center rounded-lg border text-6xl">
            {album.title.charAt(0)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="metal-title text-3xl sm:text-4xl">{album.title}</h1>
          <div className="metal-rule mt-2 w-48" />

          <p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Link
              href={`/bands/${album.band.slug}`}
              className="text-foreground font-medium hover:underline"
            >
              {album.band.name}
            </Link>
            <span className="border-border rounded border px-2 py-0.5 text-xs tracking-wide uppercase">
              {TYPE_LABELS[album.type]}
            </span>
            <span className="font-mono">
              {album.releaseYear ?? "année inconnue"}
            </span>
            {album.tracks.length > 0 && (
              <span>
                {album.tracks.length}{" "}
                {album.tracks.length > 1 ? "pistes" : "piste"}
              </span>
            )}
          </p>
        </div>
      </header>

      <section aria-label="Tracklist" className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">Tracklist</h2>

        {album.tracks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune piste référencée pour cette sortie.
          </p>
        ) : (
          <ol className="divide-border border-border divide-y rounded-lg border">
            {album.tracks.map((track) => (
              <li
                key={track.id}
                className="bg-card flex items-center gap-3 px-4 py-2.5"
              >
                <span className="text-muted-foreground w-8 shrink-0 text-right font-mono text-sm">
                  {track.trackNumber}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {track.title}
                </span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs">
                  {formatDuration(track.durationMs)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-muted-foreground text-xs">
        Les écoutes et visuels proviennent exclusivement des plateformes
        officielles référencées pour ce groupe.{" "}
        <Link
          href={`/bands/${album.band.slug}`}
          className="hover:text-foreground underline"
        >
          Voir la fiche de {album.band.name}
        </Link>
        .
      </p>
    </article>
  );
}
