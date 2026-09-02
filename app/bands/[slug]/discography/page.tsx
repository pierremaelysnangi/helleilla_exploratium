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
import { z } from "zod";
// Fetch serveur : groupe par slug, puis ses albums
import { fetchBandBySlug } from "@/hooks/use-bands";
import { apiFetch } from "@/lib/api/client";
import { albumRowSchema, type AlbumRow } from "@/hooks/api/schemas";
// Présentation
import { AlbumCard } from "@/components/albums/albumCard";
import { EmptyState } from "@/components/shared/emptyState";

type DiscographyPageProps = {
  params: Promise<{ slug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Enveloppe paginée de GET /api/albums, réduite à ce qui est utilisé. */
const albumsPageSchema = z.object({ data: z.array(albumRowSchema) });

/** Ordre d'affichage des sections : sorties principales d'abord. */
const TYPE_ORDER: AlbumRow["type"][] = [
  "album",
  "ep",
  "single",
  "live",
  "compilation",
  "demo",
];

/** Titres de section par type de sortie. */
const TYPE_SECTIONS: Record<AlbumRow["type"], string> = {
  album: "Albums studio",
  ep: "EP",
  single: "Singles",
  live: "Live",
  compilation: "Compilations",
  demo: "Démos",
};

/** Charge la discographie complète d'un groupe, triée du plus ancien. */
async function fetchDiscography(bandId: string): Promise<AlbumRow[]> {
  const payload = await apiFetch("/api/albums", albumsPageSchema, {
    query: { bandId, perPage: 100, sort: "year", order: "asc" },
    revalidate: 60,
  });
  return payload.data;
}

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

  // Regroupement par type, dans l'ordre éditorial défini plus haut
  const sections = TYPE_ORDER.map((type) => ({
    type,
    albums: albums.filter((album) => album.type === type),
  })).filter((section) => section.albums.length > 0);

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

      {sections.length === 0 ? (
        <EmptyState
          title="Aucune sortie référencée"
          description={`La discographie de ${band.name} n'a pas encore été documentée.`}
          ctaHref={`/bands/${band.slug}`}
          ctaLabel="Retour à la fiche du groupe"
        />
      ) : (
        sections.map((section) => (
          <section
            key={section.type}
            aria-label={TYPE_SECTIONS[section.type]}
            className="flex flex-col gap-3"
          >
            <h2 className="metal-title text-lg">
              {TYPE_SECTIONS[section.type]}
            </h2>
            <ul className="3xl:grid-cols-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {section.albums.map((album) => (
                <li key={album.id}>
                  <AlbumCard album={album} bandSlug={band.slug} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </article>
  );
}
