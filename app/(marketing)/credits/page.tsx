/**
 * Page « Crédits et droits » (/credits) — Server Component statique.
 *
 * C'est la page qu'on cite face à un signalement : elle dit d'où vient
 * chaque élément affiché et à quel titre il l'est. Le texte s'adresse à
 * un lecteur, pas à un juriste ni à un développeur — le détail technique
 * appartient au code, l'argumentaire juridique à un conseil.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const TITLE = "Crédits et droits";
const DESCRIPTION =
  "D'où viennent les pochettes, les photos et les informations de ce site, et à qui elles appartiennent.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/credits" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/credits`,
  },
};

/** Sources de données, avec leur licence et l'usage qui en est fait. */
const DATA_SOURCES = [
  {
    name: "MusicBrainz",
    url: "https://musicbrainz.org",
    licence:
      "Données de base sous CC0, données complémentaires sous CC BY-NC-SA",
    usage:
      "Identité des groupes, line-up, discographies, liens officiels déclarés.",
  },
  {
    name: "Wikidata",
    url: "https://www.wikidata.org",
    licence: "CC0 1.0 (domaine public)",
    usage: "Identifiants croisés, résumés, photo et logo officiels.",
  },
  {
    name: "Wikimedia Commons",
    url: "https://commons.wikimedia.org",
    licence: "Licences libres au cas par cas, indiquées sur chaque fichier",
    usage:
      "Photos et logos affichés par lien direct ; la page du fichier porte l'auteur et la licence.",
  },
  {
    name: "Cover Art Archive",
    url: "https://coverartarchive.org",
    licence:
      "Visuels sous droits de leurs ayants droit, diffusés par l'archive",
    usage: "Pochettes d'album, affichées depuis l'archive, jamais recopiées.",
  },
  {
    name: "Discogs",
    url: "https://www.discogs.com",
    licence: "API publique, contenus sous droits de leurs déposants",
    usage: "Visuels et liens complémentaires.",
  },
  {
    name: "Deezer",
    url: "https://www.deezer.com",
    licence: "API publique",
    usage: "Pochettes et photos d'artiste, quand aucune archive n'en propose.",
  },
];

export default async function CreditsPage() {
  const { t } = await getTranslations();
  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">
          {t.pages.creditsTitle}
        </h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="mt-4 text-sm leading-relaxed">{t.pages.creditsLead}</p>
      </header>

      <section aria-labelledby="medias" className="flex flex-col gap-3">
        <h2 id="medias" className="metal-title text-lg">
          {t.pages.imagesTitle}
        </h2>
        <p className="text-sm leading-relaxed">{t.pages.imagesBody1}</p>
        <p className="text-sm leading-relaxed">{t.pages.imagesBody2}</p>
      </section>

      <section aria-labelledby="musique" className="flex flex-col gap-3">
        <h2 id="musique" className="metal-title text-lg">
          {t.pages.musicTitle}
        </h2>
        <p className="text-sm leading-relaxed">{t.pages.musicBody}</p>
      </section>

      <section aria-labelledby="argent" className="flex flex-col gap-3">
        <h2 id="argent" className="metal-title text-lg">
          {t.pages.moneyTitle}
        </h2>
        <p className="text-sm leading-relaxed">{t.pages.moneyBody}</p>
      </section>

      <section aria-labelledby="sources" className="flex flex-col gap-3">
        <h2 id="sources" className="metal-title text-lg">
          {t.pages.dataTitle}
        </h2>
        <ul className="flex flex-col gap-2">
          {DATA_SOURCES.map((source) => (
            <li key={source.name} className="metal-card px-4 py-3">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold hover:underline"
              >
                {source.name} ↗
              </a>
              <span className="text-muted-foreground mt-1 block text-xs">
                {source.licence}
              </span>
              <span className="mt-1 block text-xs">{source.usage}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="retrait" className="flex flex-col gap-3">
        <h2 id="retrait" className="metal-title text-lg">
          {t.pages.takedownTitle}
        </h2>
        <p className="text-sm leading-relaxed">{t.pages.takedownBody}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t.pages.takedownNote}
        </p>
      </section>

      <section aria-labelledby="explorer" className="flex flex-col gap-3">
        <h2 id="explorer" className="metal-title text-lg">
          {t.pages.furtherTitle}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {[
            { href: "/about", label: "À propos" },
            { href: "/contributions", label: "Contribuer" },
            { href: "/bands", label: "Groupes" },
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
