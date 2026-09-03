/**
 * Page détail d'un groupe (/bands/[slug]) — Server Component.
 * SSR du contenu indexable (nom, bio, genres) via GET by-slug ;
 * l'enrichissement média (providers externes) charge progressivement
 * côté client dans <BandMediaSection>.
 *
 * SEO : metadata dynamique (canonical + OpenGraph) et données
 * structurées schema.org `MusicGroup` pour les rich results Google.
 */

// Récupération RSC + 404 Next
import { notFound } from "next/navigation";
import type { Metadata } from "next";
// Fetch serveur par slug
import { fetchBandBySlug } from "@/hooks/use-bands";
// Présentation
import { BandHeader } from "@/components/bands/bandHeader";
// Visuel du groupe en fond de fiche
import { BandBackdrop } from "@/components/media/mediaBackdrop";
import { BandMediaSection } from "@/components/bands/bandMediaSection";
import { DiscographySections } from "@/components/bands/discographySections";
// Chargement serveur de la discographie complète
import { fetchDiscography } from "@/lib/api/discography";
import { getTranslations } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/format";

/** Props App Router : params est une promesse en Next 15+. */
type BandDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Metadata dynamique : canonical, OpenGraph, description depuis la bio. */
export async function generateMetadata({
  params,
}: BandDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [band, { t }] = await Promise.all([
    fetchBandBySlug(slug),
    getTranslations(),
  ]);
  if (!band) return { title: t.meta.bandNotFound, robots: { index: false } };

  const title = band.name;
  const description =
    band.bio?.slice(0, 160) ??
    interpolate(t.meta.bandFallbackDescription, {
      band: band.name,
      from: band.formedYear ?? "?",
      to: band.dissolvedYear ?? "…",
    });

  return {
    title,
    description,
    alternates: { canonical: `/bands/${band.slug}` },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `${BASE_URL}/bands/${band.slug}`,
    },
  };
}

/**
 * Construit les données structurées schema.org `MusicGroup`.
 * Champs alignés sur le vocabulaire Google (rich results musique) :
 * https://developers.google.com/search/docs/appearance/structured-data
 */
function buildMusicGroupJsonLd(
  band: NonNullable<Awaited<ReturnType<typeof fetchBandBySlug>>>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: band.name,
    url: `${BASE_URL}/bands/${band.slug}`,
    ...(band.imageUrl ? { image: band.imageUrl } : {}),
    ...(band.formedYear ? { foundingDate: String(band.formedYear) } : {}),
    ...(band.dissolvedYear
      ? { dissolutionDate: String(band.dissolvedYear) }
      : {}),
    ...(band.countryCode
      ? { nationality: { "@type": "Country", name: band.countryCode } }
      : {}),
    ...(band.genres.length > 0
      ? { genre: band.genres.map((g) => g.name) }
      : {}),
    ...(band.bio ? { description: band.bio.slice(0, 500) } : {}),
  };
}

export default async function BandDetailPage({ params }: BandDetailPageProps) {
  const { slug } = await params;
  const band = await fetchBandBySlug(slug);

  // Slug inconnu -> page 404 applicative
  if (!band) notFound();

  const discography = await fetchDiscography(band.id);
  const { t, n } = await getTranslations();

  return (
    <article className="flex flex-col gap-8">
      {/* Données structurées pour le crawl Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildMusicGroupJsonLd(band)),
        }}
      />

      <BandBackdrop imageUrl={band.imageUrl} />

      <BandHeader band={band} />
      {/* Enrichissement providers externes (client, progressif) */}
      <BandMediaSection bandId={band.id} bandName={band.name} />

      {/* Discographie en cartes : rendue côté serveur, donc présente au
          premier affichage — le tableau client précédent laissait un
          espace vide le temps de sa requête. */}
      <section aria-label={t.band.discography} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="metal-title text-lg">{t.band.discography}</h2>
          <span className="text-muted-foreground text-sm">
            {n(t.count.releases, discography.length)}
          </span>
        </div>
        <DiscographySections
          t={t}
          albums={discography}
          bandSlug={band.slug}
          bandName={band.name}
          bandImageUrl={band.imageUrl}
        />
      </section>
    </article>
  );
}
