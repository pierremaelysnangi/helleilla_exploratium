/**
 * Page détail d'un genre (/genres/[slug]) — Server Component.
 *
 * Le slug de genre est unique globalement : un seul segment suffit, sans
 * l'ambiguïté qui touche les albums.
 *
 * Rend le contexte hiérarchique (genre parent, sous-genres) et les groupes
 * rattachés, tous indexables côté serveur.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
// Fetch serveur par slug
import { fetchGenreBySlug } from "@/hooks/use-genres";
// Présentation réutilisée
import { GenreCard } from "@/components/genres/genreCard";
import { BandCard } from "@/components/bands/bandCard";
import { EmptyState } from "@/components/shared/emptyState";
import { getTranslations } from "@/lib/i18n/server";

type GenrePageProps = {
  params: Promise<{ slug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: GenrePageProps): Promise<Metadata> {
  const { slug } = await params;
  const genre = await fetchGenreBySlug(slug);
  if (!genre) return { title: "Genre introuvable", robots: { index: false } };

  const count = genre.bands.length;
  const description =
    count > 0
      ? `${count} ${count > 1 ? "groupes" : "groupe"} référencés en ${genre.name}${
          genre.parent ? `, sous-genre de ${genre.parent.name}` : ""
        }.`
      : `Le genre ${genre.name} dans l'encyclopédie Helleilla Exploratium.`;

  return {
    title: genre.name,
    description,
    alternates: { canonical: `/genres/${genre.slug}` },
    openGraph: {
      type: "website",
      title: genre.name,
      description,
      url: `${BASE_URL}/genres/${genre.slug}`,
    },
  };
}

export default async function GenreDetailPage({ params }: GenrePageProps) {
  const { t } = await getTranslations();
  const { slug } = await params;
  const genre = await fetchGenreBySlug(slug);

  if (!genre) notFound();

  return (
    <article className="flex flex-col gap-8">
      {/* Fil d'Ariane, enrichi du parent quand le genre en a un */}
      <nav aria-label="Fil d'Ariane" className="text-muted-foreground text-sm">
        <Link href="/genres" className="hover:text-foreground">
          Genres
        </Link>
        {genre.parent && (
          <>
            <span aria-hidden> / </span>
            <Link
              href={`/genres/${genre.parent.slug}`}
              className="hover:text-foreground"
            >
              {genre.parent.name}
            </Link>
          </>
        )}
        <span aria-hidden> / </span>
        <span className="text-foreground">{genre.name}</span>
      </nav>

      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">{genre.name}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          {genre.bands.length}{" "}
          {genre.bands.length > 1 ? "groupes référencés" : "groupe référencé"}
          {genre.subgenres.length > 0 &&
            ` · ${genre.subgenres.length} ${
              genre.subgenres.length > 1 ? "sous-genres" : "sous-genre"
            }`}
        </p>
      </header>

      {genre.subgenres.length > 0 && (
        <section aria-label="Sous-genres" className="flex flex-col gap-3">
          <h2 className="metal-title text-lg">Sous-genres</h2>
          <ul className="3xl:grid-cols-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {genre.subgenres.map((sub) => (
              <li key={sub.id}>
                <GenreCard genre={sub} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Groupes" className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">Groupes</h2>

        {genre.bands.length === 0 ? (
          <EmptyState
            title={t.app.noBandInGenre}
            description="Ce genre existe dans la taxonomie mais aucun groupe n'y est encore rattaché."
            ctaHref="/bands"
            ctaLabel="Parcourir le catalogue"
          />
        ) : (
          <ul className="3xl:grid-cols-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {genre.bands.map((band) => (
              <li key={band.id}>
                <BandCard band={band} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
