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
import { CoverImage } from "@/components/albums/coverImage";
// Fetch serveur par slugs
import { fetchAlbumBySlug } from "@/hooks/use-albums";
// Type du détail validé
import type { AlbumDetail } from "@/hooks/api/schemas";
// Note personnelle et liste de l'utilisateur (client)
import { AlbumActions } from "@/components/collections/albumActions";
// Tracklist interactive : menu déroulant par piste (écoute + paroles)
import { AlbumTracklist } from "@/components/albums/albumTracklist";

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

/**
 * Durée cumulée d'une tracklist, en `1 h 12 min` ou `47 min`.
 *
 * Affichée en tête de fiche : c'est l'information qu'on cherche avant
 * d'ouvrir la tracklist, et elle situe une sortie (EP ou double album)
 * mieux que le nombre de pistes seul.
 */
function formatTotalDuration(tracks: AlbumDetail["tracks"]): string | null {
  const total = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  if (total === 0) return null;
  const minutes = Math.round(total / 60000);
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest === 0
    ? `${Math.floor(minutes / 60)} h`
    : `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, "0")} min`;
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

  const totalDuration = formatTotalDuration(album.tracks);

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
        {/* Même repli que dans les grilles : l'archive amont peut renvoyer
            un 504, et une image brisée en tête de page est plus visible
            qu'ailleurs. */}
        <div className="border-border bg-muted relative h-56 w-56 shrink-0 overflow-hidden rounded-lg border">
          <CoverImage
            src={album.coverUrl}
            title={album.title}
            bandImageUrl={album.band.imageUrl}
            bandName={album.band.name}
            sizes="224px"
          />
        </div>

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
            {totalDuration && (
              <span className="text-foreground font-mono">{totalDuration}</span>
            )}
          </p>
        </div>
      </header>

      <AlbumActions albumId={album.id} />

      <section aria-label="Tracklist" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="metal-title text-lg">Tracklist</h2>
          {totalDuration && (
            <span className="text-muted-foreground font-mono text-sm">
              Durée totale : {totalDuration}
            </span>
          )}
        </div>

        {album.tracks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune piste référencée pour cette sortie.
          </p>
        ) : (
          <AlbumTracklist tracks={album.tracks} artistName={album.band.name} />
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
