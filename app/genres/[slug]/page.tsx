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
// Fetch serveur par slug
import { fetchGenreBySlug } from "@/hooks/use-genres";
// Présentation réutilisée
import { GenreCard } from "@/components/genres/genreCard";
import { BandCard } from "@/components/bands/bandCard";
import { EmptyState } from "@/components/shared/emptyState";
import { getTranslations } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/format";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { SITE_NAME } from "@/lib/site";

type GenrePageProps = {
  params: Promise<{ slug: string }>;
};

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: GenrePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [genre, { t, n }] = await Promise.all([
    fetchGenreBySlug(slug),
    getTranslations(),
  ]);
  if (!genre) return { title: t.meta.genreNotFound, robots: { index: false } };

  const description =
    genre.bands.length > 0
      ? interpolate(t.meta.genreDescription, {
          bands: n(t.count.bands, genre.bands.length),
          genre: genre.name,
          parent: genre.parent
            ? interpolate(t.meta.genreSubgenreOf, { parent: genre.parent.name })
            : "",
        })
      : interpolate(t.meta.genreEmptyDescription, {
          genre: genre.name,
          site: SITE_NAME,
        });

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
  const { t, n } = await getTranslations();
  const { slug } = await params;
  const genre = await fetchGenreBySlug(slug);

  if (!genre) notFound();

  return (
    <article className="flex flex-col gap-8">
      {/* Fil d'Ariane, enrichi du parent quand le genre en a un */}
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/genres", label: t.nav.genres },
          ...(genre.parent
            ? [
                {
                  href: `/genres/${genre.parent.slug}`,
                  label: genre.parent.name,
                },
              ]
            : []),
          { label: genre.name },
        ]}
      />

      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">{genre.name}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          {n(t.count.bands, genre.bands.length)}
          {genre.subgenres.length > 0 &&
            ` · ${n(t.count.subgenres, genre.subgenres.length)}`}
        </p>
      </header>

      {genre.subgenres.length > 0 && (
        <section aria-label={t.genre.subgenres} className="flex flex-col gap-3">
          <h2 className="metal-title text-lg">{t.genre.subgenres}</h2>
          <ul className="3xl:grid-cols-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {genre.subgenres.map((sub) => (
              <li key={sub.id}>
                <GenreCard genre={sub} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label={t.nav.bands} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.nav.bands}</h2>

        {genre.bands.length === 0 ? (
          <EmptyState
            title={t.app.noBandInGenre}
            description={t.genre.emptyDescription}
            ctaHref="/bands"
            ctaLabel={t.genre.browseCatalogue}
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
