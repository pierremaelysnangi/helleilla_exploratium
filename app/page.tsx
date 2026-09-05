/**
 * Page d'accueil — vitrine du site : présentation, accès direct aux
 * sections du catalogue et recherche rapide.
 */

import type { Metadata } from "next";
import Link from "next/link";
// Lectures directes : l'accueil est un Server Component, repasser par
// l'API n'ajouterait qu'un aller-retour pour des données publiques.
import { listRecentAlbums, listTopRatedAlbums } from "@/db/queries/widgets";
import { listRecentForumPosts } from "@/db/queries/forum";
import { RecentAlbums } from "@/components/widgets/recentAlbums";
import { TopRatedAlbums } from "@/components/widgets/topRatedAlbums";
import { LatestForumPosts } from "@/components/widgets/latestForumPosts";
import { SITE_NAME } from "@/lib/site";
import { getTranslations } from "@/lib/i18n/server";
import { rich } from "@/lib/i18n/rich";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Salut de la scène, universel : ne se traduit pas. */
const METAL_HORNS = "\\m/";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.nav.home, description: t.meta.homeDescription };
}

/**
 * Entrées d'accès rapide vers les sections principales.
 *
 * Construites à partir du dictionnaire plutôt que figées : ce sont trois
 * libellés et trois phrases affichés à l'écran, au même titre que le
 * reste de la page.
 */
function sectionsOf(t: Dictionary) {
  return [
    {
      href: "/bands",
      title: t.nav.bands,
      description: t.home.bandsSection,
    },
    {
      href: "/albums",
      title: t.nav.albums,
      description: t.home.albumsSection,
    },
    {
      href: "/genres",
      title: t.nav.genres,
      description: t.home.genresSection,
    },
  ];
}

/** Rafraîchit les widgets sans redéploiement, sans requêter à chaque vue. */
export const revalidate = 300;

/**
 * Charge les widgets en tolérant une panne de base : l'accueil doit rester
 * servable même dégradé, comme le fait déjà le sitemap.
 */
async function loadWidgets() {
  try {
    const [recentAlbums, topRated, forumPosts] = await Promise.all([
      listRecentAlbums(8),
      listTopRatedAlbums(5),
      listRecentForumPosts(4),
    ]);
    return { recentAlbums, topRated, forumPosts };
  } catch (err) {
    console.error("[accueil] Widgets indisponibles :", err);
    return { recentAlbums: [], topRated: [], forumPosts: [] };
  }
}

export default async function HomePage() {
  const { recentAlbums, topRated, forumPosts } = await loadWidgets();
  const { t, n, locale } = await getTranslations();
  const sections = sectionsOf(t);

  return (
    <div className="flex flex-col gap-10">
      {/* Héro */}
      <section className="flex flex-col items-center gap-4 py-10 text-center">
        {/* Nom du site : marque, jamais traduite. */}
        <h1 className="metal-title text-4xl sm:text-5xl">{SITE_NAME}</h1>
        <p className="text-muted-foreground max-w-xl">
          {t.home.tagline}
          {` ${METAL_HORNS}`}
        </p>
        <Link
          href="/bands"
          className="bg-primary text-primary-foreground rounded-md px-6 py-2.5 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-90"
        >
          {t.home.explore}
        </Link>
        <p className="text-muted-foreground text-xs">
          {/* Le raccourci est inséré DANS la phrase : les langues ne le
              placent pas au même endroit, et le découper en morceaux
              imposerait l'ordre des mots du français. */}
          {rich(t.home.shortcutHint, {
            keys: (
              <>
                <kbd>{t.app.ctrlKey}</kbd>+<kbd>{t.app.searchKey}</kbd>
              </>
            ),
          })}
        </p>
      </section>

      {/* Accès aux sections — masqué à partir de `lg` : la navigation
          principale y propose déjà Groupes, Albums et Genres, et les
          répéter en pleine page repoussait le catalogue vers le bas.
          En dessous, la navigation est repliée derrière le burger : ces
          cartes redeviennent le chemin le plus court. */}
      <section
        aria-label={t.home.sections}
        className="grid gap-4 sm:grid-cols-3 lg:hidden"
      >
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="metal-card hover:bg-accent/30 p-5"
          >
            <h2 className="metal-title text-base">{section.title}</h2>
            <div className="metal-rule mt-2 w-16" />
            <p className="text-muted-foreground mt-3 text-sm">
              {section.description}
            </p>
          </Link>
        ))}
      </section>

      {/* Widgets : chacun disparaît si le catalogue n'a rien à montrer,
          plutôt que d'afficher une section vide. */}
      <RecentAlbums albums={recentAlbums} title={t.home.recentAlbums} />
      <TopRatedAlbums albums={topRated} t={t} n={n} />
      <LatestForumPosts posts={forumPosts} t={t} locale={locale} />
    </div>
  );
}
