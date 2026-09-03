/**
 * Discographie d'un groupe (/bands/[slug]/discography) — Server Component.
 *
 * Vue complémentaire, et non redondante, de la fiche groupe : celle-ci
 * rend une grille de pochettes SSR (indexable, chaque album menant à sa
 * page détail), là où `<DiscographyTable>` de la fiche est un tableau
 * client dépliable centré sur l'écoute des pistes.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
// Fetch serveur : groupe par slug, puis ses albums
import { fetchBandBySlug } from "@/hooks/use-bands";
import { fetchDiscography } from "@/lib/api/discography";
// Présentation — mêmes sections que la fiche du groupe
import { DiscographySections } from "@/components/bands/discographySections";
import { EmptyState } from "@/components/shared/emptyState";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { getTranslations } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/format";

type DiscographyPageProps = {
  params: Promise<{ slug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: DiscographyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [band, { t }] = await Promise.all([
    fetchBandBySlug(slug),
    getTranslations(),
  ]);
  if (!band) return { title: t.meta.bandNotFound, robots: { index: false } };

  const title = interpolate(t.band.discographyOf, { band: band.name });
  const description = interpolate(t.meta.discographyDescription, {
    band: band.name,
  });

  return {
    title,
    description,
    alternates: { canonical: `/bands/${band.slug}/discography` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE_URL}/bands/${band.slug}/discography`,
    },
  };
}

export default async function DiscographyPage({
  params,
}: DiscographyPageProps) {
  const { slug } = await params;
  const band = await fetchBandBySlug(slug);

  if (!band) notFound();

  const albums = await fetchDiscography(band.id);
  const { t, n } = await getTranslations();

  return (
    <article className="flex flex-col gap-8">
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/bands", label: t.nav.bands },
          { href: `/bands/${band.slug}`, label: band.name },
          { label: t.band.discography },
        ]}
      />

      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">
          {interpolate(t.band.discographyOf, { band: band.name })}
        </h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          {n(t.count.releases, albums.length)}
        </p>
      </header>

      {albums.length === 0 ? (
        <EmptyState
          title={t.app.noReleaseListed}
          description={interpolate(t.band.noDiscographyYet, {
            band: band.name,
          })}
          ctaHref={`/bands/${band.slug}`}
          ctaLabel={t.member.backToBand}
        />
      ) : (
        <DiscographySections
          t={t}
          albums={albums}
          bandSlug={band.slug}
          bandName={band.name}
          bandImageUrl={band.imageUrl}
        />
      )}
    </article>
  );
}
