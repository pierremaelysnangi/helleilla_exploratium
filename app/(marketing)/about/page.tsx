/**
 * Page « À propos » (/about) — Server Component statique.
 *
 * Elle porte la règle fondatrice du projet (aucun média généré par IA,
 * preuves officielles obligatoires) : c'est la page que l'on cite quand
 * quelqu'un demande pourquoi une contribution est refusée.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";

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

export default async function AboutPage() {
  const { t } = await getTranslations();
  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">
          {t.pages.aboutTitle}
        </h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="mt-4 text-sm leading-relaxed">{t.pages.aboutLead}</p>
      </header>

      <section aria-labelledby="pourquoi" className="flex flex-col gap-3">
        <h2 id="pourquoi" className="metal-title text-lg">
          {t.pages.whyTitle}
        </h2>
        <p className="text-sm leading-relaxed">{t.pages.whyBody}</p>
      </section>

      <section aria-labelledby="regle" className="flex flex-col gap-3">
        <h2 id="regle" className="metal-title text-lg">
          {t.pages.ruleTitle}
        </h2>
        <p className="text-sm leading-relaxed">{t.pages.ruleBody1}</p>
        <p className="text-sm leading-relaxed">{t.pages.ruleBody2}</p>
      </section>

      <section aria-labelledby="preuves" className="flex flex-col gap-3">
        <h2 id="preuves" className="metal-title text-lg">
          {t.pages.howTitle}
        </h2>
        <p className="text-sm leading-relaxed">{t.pages.howBody}</p>
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
          {t.pages.startTitle}
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
