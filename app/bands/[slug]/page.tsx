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
import { BandMediaSection } from "@/components/bands/bandMediaSection";
import { DiscographyTable } from "@/components/bands/discographyTable";

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
  const band = await fetchBandBySlug(slug);
  if (!band) return { title: "Groupe introuvable", robots: { index: false } };

  const title = band.name;
  const description =
    band.bio?.slice(0, 160) ??
    `${band.name} : période d'activité ${band.formedYear ?? "?"} – ${band.dissolvedYear ?? "…"}, genres et médias officiels.`;

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

  return (
    <article className="flex flex-col gap-8">
      {/* Données structurées pour le crawl Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildMusicGroupJsonLd(band)),
        }}
      />

      <BandHeader band={band} />
      {/* Enrichissement providers externes (client, progressif) */}
      <BandMediaSection bandId={band.id} />

      {/* Discographie dépliable (albums -> tracklists) */}
      <section aria-label="Discographie" className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">Discographie</h2>
        <DiscographyTable bandId={band.id} bandName={band.name} />
      </section>
    </article>
  );
}
