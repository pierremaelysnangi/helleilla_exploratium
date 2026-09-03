/**
 * Page d'accueil — vitrine du site : présentation, accès direct aux
 * sections du catalogue et recherche rapide.
 */

import type { Metadata } from "next";
import Link from "next/link";
// Lectures directes : l'accueil est un Server Component, repasser par
// l'API n'ajouterait qu'un aller-retour pour des données publiques.
import {
  listRecentAlbums,
  listRecentBands,
  listTopRatedAlbums,
} from "@/db/queries/widgets";
import { RecentAlbums } from "@/components/widgets/recentAlbums";
import { RecentBands } from "@/components/widgets/recentBands";
import { TopRatedAlbums } from "@/components/widgets/topRatedAlbums";
import { getTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "L'encyclopédie collaborative du metal : groupes, discographies et genres, sources à l'appui.",
};

/** Entrées d'accès rapide vers les sections principales. */
const SECTIONS = [
  {
    href: "/bands",
    title: "Groupes",
    description:
      "Catalogue des groupes : pays, périodes d'activité, membres et discographies.",
  },
  {
    href: "/albums",
    title: "Albums",
    description: "Albums, EP, singles, lives et démos triés par année.",
  },
  {
    href: "/genres",
    title: "Genres",
    description: "La taxonomie complète, du black metal au doom.",
  },
] as const;

/** Rafraîchit les widgets sans redéploiement, sans requêter à chaque vue. */
export const revalidate = 300;

/**
 * Charge les widgets en tolérant une panne de base : l'accueil doit rester
 * servable même dégradé, comme le fait déjà le sitemap.
 */
async function loadWidgets() {
  try {
    const [recentBands, recentAlbums, topRated] = await Promise.all([
      listRecentBands(4),
      listRecentAlbums(8),
      listTopRatedAlbums(5),
    ]);
    return { recentBands, recentAlbums, topRated };
  } catch (err) {
    console.error("[accueil] Widgets indisponibles :", err);
    return { recentBands: [], recentAlbums: [], topRated: [] };
  }
}

export default async function HomePage() {
  const { recentBands, recentAlbums, topRated } = await loadWidgets();
  const { t } = await getTranslations();

  return (
    <div className="flex flex-col gap-10">
      {/* Héro */}
      <section className="flex flex-col items-center gap-4 py-10 text-center">
        <h1 className="metal-title text-4xl sm:text-5xl">
          Helleilla Exploratium
        </h1>
        <p className="text-muted-foreground max-w-xl">
          {t.home.tagline}
          {" \\m/"}
        </p>
        <Link
          href="/bands"
          className="bg-primary text-primary-foreground rounded-md px-6 py-2.5 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-90"
        >
          {t.home.explore}
        </Link>
        <p className="text-muted-foreground text-xs">
          Astuce : <kbd>Ctrl</kbd>+<kbd>K</kbd> pour la recherche rapide
        </p>
      </section>

      {/* Accès aux sections — masqué à partir de `lg` : la navigation
          principale y propose déjà Groupes, Albums et Genres, et les
          répéter en pleine page repoussait le catalogue vers le bas.
          En dessous, la navigation est repliée derrière le burger : ces
          cartes redeviennent le chemin le plus court. */}
      <section
        aria-label="Sections"
        className="grid gap-4 sm:grid-cols-3 lg:hidden"
      >
        {SECTIONS.map((section) => (
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
      <TopRatedAlbums albums={topRated} title={t.home.topRated} />
      <RecentBands bands={recentBands} title={t.home.recentBands} />
    </div>
  );
}
