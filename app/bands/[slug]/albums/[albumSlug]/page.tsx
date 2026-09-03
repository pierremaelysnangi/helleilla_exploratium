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
// Mise en forme des durées, partagée avec la tracklist
import { formatTotalDuration, totalDurationIso } from "@/lib/media/duration";
// Tracklist interactive : menu déroulant par piste
import { AlbumTracklist } from "@/components/albums/albumTracklist";
// Critiques de presse : pendant professionnel des notes d'auditeurs
import { PressReviews } from "@/components/albums/pressReviews";
import { getTranslations } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/format";
import { rich } from "@/lib/i18n/rich";
import { Breadcrumb } from "@/components/shared/breadcrumb";
// Fond de page : la pochette, très adoucie
import { AlbumBackdrop } from "@/components/media/mediaBackdrop";

type AlbumPageProps = {
  params: Promise<{ slug: string; albumSlug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { slug, albumSlug } = await params;
  const [album, { t }] = await Promise.all([
    fetchAlbumBySlug(slug, albumSlug),
    getTranslations(),
  ]);
  if (!album) return { title: t.meta.albumNotFound, robots: { index: false } };

  const title = `${album.title} — ${album.band.name}`;
  const description = interpolate(
    album.releaseYear ? t.meta.albumDescriptionDated : t.meta.albumDescription,
    {
      type: t.releaseType[album.type],
      band: album.band.name,
      year: album.releaseYear ?? "",
    },
  );

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
  const { t, n } = await getTranslations();

  return (
    <article className="flex flex-col gap-8">
      <AlbumBackdrop imageUrl={album.coverUrl ?? album.band.imageUrl} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildMusicAlbumJsonLd(album)),
        }}
      />

      {/* Fil d'Ariane : l'album n'existe que dans son groupe */}
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/bands", label: t.nav.bands },
          { href: `/bands/${album.band.slug}`, label: album.band.name },
          { label: album.title },
        ]}
      />

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
              {t.releaseType[album.type]}
            </span>
            {/* Année masquée quand elle est inconnue : écrire
                « année inconnue » occupait une place pour ne rien dire. */}
            {album.releaseYear !== null && (
              <span className="font-mono">{album.releaseYear}</span>
            )}
            {album.tracks.length > 0 && (
              <span>{n(t.count.tracks, album.tracks.length)}</span>
            )}
            {totalDuration && (
              <span className="text-foreground font-mono">
                {totalDuration.partial
                  ? `≥ ${totalDuration.label}`
                  : totalDuration.label}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Tracklist et critiques côte à côte à partir de `lg` : la
          tracklist se lit en colonne étroite, et reléguer les critiques
          tout en bas les rendait invisibles. En dessous, empilement. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label={t.album.tracklist} className="flex flex-col gap-3">
          {/* La durée totale n'est plus répétée ici : l'en-tête de la
              fiche la porte déjà, à quelques centimètres au-dessus. */}
          <h2 className="metal-title text-lg">{t.album.tracklist}</h2>

          {album.tracks.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.album.noTracks}</p>
          ) : (
            <AlbumTracklist
              tracks={album.tracks}
              artistName={album.band.name}
            />
          )}
        </section>

        <section aria-label={t.album.reviews} className="flex flex-col gap-3">
          <h2 className="metal-title text-lg">{t.album.reviews}</h2>
          {/* Presse et auditeurs séparés : ce sont deux jugements
              différents, et les fondre en une note unique effacerait
              l'écart qui fait justement l'intérêt de la comparaison. */}
          <PressReviews albumId={album.id} />
          <AlbumActions albumId={album.id} />
        </section>
      </div>

      {/* Provenance des visuels : la phrase entière vit dans le
          dictionnaire, le lien étant inséré là où chaque langue le
          place. */}
      <p className="text-muted-foreground text-xs">
        {rich(t.album.sourceNotice, {
          link: (
            <Link
              href={`/bands/${album.band.slug}`}
              className="hover:text-foreground underline"
            >
              {interpolate(t.album.seeBandPage, { band: album.band.name })}
            </Link>
          ),
        })}
      </p>
    </article>
  );
}
