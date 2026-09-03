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
// Critiques de presse : pendant professionnel des notes d'auditeurs
import { PressReviews } from "@/components/albums/pressReviews";

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
  split: "Split",
};

/**
 * Durée cumulée d'une tracklist, en `1 h 12 min` ou `47 min`.
 *
 * Affichée en tête de fiche : c'est l'information qu'on cherche avant
 * d'ouvrir la tracklist, et elle situe une sortie (EP ou double album)
 * mieux que le nombre de pistes seul.
 */
function formatTotalDuration(
  tracks: AlbumDetail["tracks"],
): { label: string; partial: boolean } | null {
  const timed = tracks.filter((t) => t.durationMs != null);
  if (timed.length === 0) return null;

  const total = timed.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  const minutes = Math.round(total / 60000);
  const rest = minutes % 60;
  const label =
    minutes < 60
      ? `${minutes} min`
      : rest === 0
        ? `${Math.floor(minutes / 60)} h`
        : `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, "0")} min`;

  // Une partie seulement des pistes est minutée : le total est un
  // MINIMUM, et l'annoncer sec laisserait croire à un album plus court
  // qu'il ne l'est. MusicBrainz ne renseigne pas les longueurs de
  // certaines rééditions et de beaucoup d'enregistrements de répétition.
  return { label, partial: timed.length < tracks.length };
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
            // Visuel principal de la page : c'est lui le Largest
            // Contentful Paint, l'attendre au défilement n'a pas de sens.
            priority
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
            {/* Année masquée quand elle est inconnue : écrire
                « année inconnue » occupait une place pour ne rien dire. */}
            {album.releaseYear !== null && (
              <span className="font-mono">{album.releaseYear}</span>
            )}
            {album.tracks.length > 0 && (
              <span>
                {album.tracks.length}{" "}
                {album.tracks.length > 1 ? "pistes" : "piste"}
              </span>
            )}
            {totalDuration && (
              <span className="text-foreground font-mono">
                {totalDuration.partial ? "≥ " : ""}
                {totalDuration.label}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Tracklist et critiques côte à côte à partir de `lg` : la
          tracklist se lit en colonne étroite, et reléguer les critiques
          tout en bas les rendait invisibles. En dessous, empilement. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label="Tracklist" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="metal-title text-lg">Tracklist</h2>
            {totalDuration && (
              <span
                className="text-muted-foreground font-mono text-sm"
                title={
                  totalDuration.partial
                    ? "Certaines pistes ne sont pas minutées : ce total est un minimum."
                    : undefined
                }
              >
                Durée totale : {totalDuration.partial ? "≥ " : ""}
                {totalDuration.label}
              </span>
            )}
          </div>

          {album.tracks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune piste référencée pour cette sortie.
            </p>
          ) : (
            <AlbumTracklist
              tracks={album.tracks}
              artistName={album.band.name}
              albumTitle={album.title}
            />
          )}
        </section>

        <section aria-label="Critiques" className="flex flex-col gap-3">
          <h2 className="metal-title text-lg">Critiques</h2>
          {/* Presse et auditeurs séparés : ce sont deux jugements
              différents, et les fondre en une note unique effacerait
              l'écart qui fait justement l'intérêt de la comparaison. */}
          <PressReviews albumId={album.id} />
          <AlbumActions albumId={album.id} />
        </section>
      </div>

      <p className="text-muted-foreground text-xs">
        Pochette et informations proviennent des sources référencées pour ce
        groupe.{" "}
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
