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
import Link from "next/link";
// Fetch serveur : groupe par slug, puis ses albums
import { fetchBandBySlug } from "@/hooks/use-bands";
import { fetchDiscography } from "@/lib/api/discography";
// Présentation — mêmes sections que la fiche du groupe
import { DiscographySections } from "@/components/bands/discographySections";
import { EmptyState } from "@/components/shared/emptyState";
import { getTranslations } from "@/lib/i18n/server";

type DiscographyPageProps = {
  params: Promise<{ slug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: DiscographyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const band = await fetchBandBySlug(slug);
  if (!band) return { title: "Groupe introuvable", robots: { index: false } };

  const title = `Discographie de ${band.name}`;
  const description = `Toutes les sorties référencées de ${band.name} : albums, EP, singles, live et démos.`;

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
  const { t } = await getTranslations();

  return (
    <article className="flex flex-col gap-8">
      <nav aria-label="Fil d'Ariane" className="text-muted-foreground text-sm">
        <Link href="/bands" className="hover:text-foreground">
          Groupes
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/bands/${band.slug}`} className="hover:text-foreground">
          {band.name}
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Discographie</span>
      </nav>

      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">
          Discographie de {band.name}
        </h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          {albums.length} {albums.length > 1 ? "sorties" : "sortie"} référencées
        </p>
      </header>

      {albums.length === 0 ? (
        <EmptyState
          title={t.app.noReleaseListed}
          description={`La discographie de ${band.name} n'a pas encore été documentée.`}
          ctaHref={`/bands/${band.slug}`}
          ctaLabel="Retour à la fiche du groupe"
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
