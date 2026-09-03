/**
 * Page « À propos » (/about) — Server Component statique.
 *
 * Elle porte la règle fondatrice du projet (aucun média généré par IA,
 * preuves officielles obligatoires) : c'est la page que l'on cite quand
 * quelqu'un demande pourquoi une contribution est refusée.
 */

import type { Metadata } from "next";
import Link from "next/link";

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const TITLE = "À propos";
const DESCRIPTION =
  "Une encyclopédie du metal écrite par ceux qui l'écoutent : groupes, discographies et genres, sources à l'appui.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/about`,
  },
};

/** Sources acceptées comme preuve officielle à la modération. */
const OFFICIAL_SOURCES = [
  {
    name: "MusicBrainz",
    detail: "base de données musicale ouverte, éditée par sa communauté",
  },
  {
    name: "Discogs",
    detail: "catalogue de sorties physiques et numériques",
  },
  {
    name: "Site officiel ou label",
    detail: "page du groupe ou de sa maison de disques",
  },
];

export default function AboutPage() {
  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">
          À propos d&apos;Helleilla Exploratium
        </h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="mt-4 text-sm leading-relaxed">
          Une encyclopédie du metal, écrite par ceux qui l&apos;écoutent.
          Groupes, discographies, genres — de la première démo autoproduite aux
          albums que tout le monde connaît.
        </p>
      </header>

      <section aria-labelledby="pourquoi" className="flex flex-col gap-3">
        <h2 id="pourquoi" className="metal-title text-lg">
          Pourquoi ce site
        </h2>
        <p className="text-sm leading-relaxed">
          Les informations sur le metal sont éparpillées : un split de 1991
          n&apos;existe que sur un forum, une démo n&apos;a jamais eu de
          pochette, un groupe a changé six fois de line-up sans que personne ne
          l&apos;écrive nulle part. On rassemble tout ça au même endroit,
          gratuitement, sans publicité et sans compte obligatoire pour lire.
        </p>
      </section>

      <section aria-labelledby="regle" className="flex flex-col gap-3">
        <h2 id="regle" className="metal-title text-lg">
          Rien d&apos;inventé, rien de généré
        </h2>
        <p className="text-sm leading-relaxed">
          Aucune image, aucun son et aucune vidéo produits par une intelligence
          artificielle n&apos;entrent ici. Les pochettes et les photos que vous
          voyez viennent des plateformes et des archives qui les publient, et
          s&apos;affichent depuis chez elles.
        </p>
        <p className="text-sm leading-relaxed">
          Les textes, eux, sont écrits par les contributeurs. Un groupe inventé
          de toutes pièces ne franchit pas la porte : il lui faudrait produire
          une référence vérifiable, et il n&apos;en a aucune.
        </p>
      </section>

      <section aria-labelledby="preuves" className="flex flex-col gap-3">
        <h2 id="preuves" className="metal-title text-lg">
          Comment contribuer
        </h2>
        <p className="text-sm leading-relaxed">
          Proposez une fiche, accompagnée d&apos;au moins deux sources dont une
          officielle. Un modérateur la relit, puis la publie ou vous demande de
          compléter. C&apos;est tout — pas de comité, pas d&apos;attente
          interminable.
        </p>
        <ul className="mt-1 flex flex-col gap-2">
          {OFFICIAL_SOURCES.map((source) => (
            <li key={source.name} className="metal-card px-4 py-3">
              <span className="text-sm font-semibold">{source.name}</span>
              <span className="text-muted-foreground block text-xs">
                {source.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="explorer" className="flex flex-col gap-3">
        <h2 id="explorer" className="metal-title text-lg">
          Commencer
        </h2>
        <ul className="flex flex-wrap gap-2">
          {[
            { href: "/bands", label: "Groupes" },
            { href: "/albums", label: "Albums" },
            { href: "/genres", label: "Genres" },
            { href: "/contributions", label: "Contribuer" },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="border-primary/40 bg-primary/10 hover:bg-primary/20 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
