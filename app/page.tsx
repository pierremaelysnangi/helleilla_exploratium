/**
 * Page d'accueil — vitrine du site : présentation, accès direct aux
 * sections du catalogue et recherche rapide.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Helleilla Exploratium : l'encyclopédie collaborative du metal — groupes, albums, genres, extraits et médias officiels.",
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

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Héro */}
      <section className="flex flex-col items-center gap-4 py-10 text-center">
        <h1 className="metal-title text-4xl sm:text-5xl">
          Helleilla Exploratium
        </h1>
        <p className="text-muted-foreground max-w-xl">
          L&apos;encyclopédie collaborative du metal : groupes, albums, genres —
          enrichie des sources officielles (MusicBrainz, Wikidata, Discogs) et
          des plateformes d&apos;écoute légitimes.
        </p>
        <Link
          href="/bands"
          className="bg-primary text-primary-foreground rounded-md px-6 py-2.5 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-90"
        >
          Explorer le catalogue
        </Link>
        <p className="text-muted-foreground text-xs">
          Astuce : <kbd>Ctrl</kbd>+<kbd>K</kbd> pour la recherche rapide
        </p>
      </section>

      {/* Accès aux sections */}
      <section aria-label="Sections" className="grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}
