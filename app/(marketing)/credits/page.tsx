/**
 * Page « Crédits et droits » (/credits) — Server Component statique.
 *
 * Elle documente d'où vient chaque élément affiché et à quel titre il
 * peut l'être. Ce n'est pas une formalité : le projet affiche des
 * pochettes, des photos et des extraits sonores qui appartiennent à des
 * tiers, et la seule chose qui distingue un usage légitime d'une
 * contrefaçon est la manière dont ils sont utilisés — référencés depuis
 * leur plateforme d'origine, jamais copiés, jamais monétisés.
 *
 * Ce texte décrit le fonctionnement réel de l'application ; il n'a pas
 * valeur d'avis juridique.
 */

import type { Metadata } from "next";
import Link from "next/link";

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const TITLE = "Crédits et droits";
const DESCRIPTION =
  "Origine des contenus affichés, droits des ayants droit, absence de monétisation et procédure de retrait.";

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
    licence: "API publique, extraits diffusés par la plateforme",
    usage:
      "Extraits de 30 secondes lus depuis les serveurs de Deezer, et pochettes de repli.",
  },
];

/** Ce que le projet ne fait pas — la liste importe autant que l'autre. */
const NOT_DONE = [
  "Aucune pochette, photo ou piste n'est copiée sur nos serveurs : seule l'adresse d'origine est enregistrée.",
  "Aucune parole de chanson n'est reproduite ; les liens renvoient vers les bases qui les publient avec l'autorisation nécessaire.",
  "Aucun média n'est produit par un modèle génératif — image, son ou vidéo. C'est la règle fondatrice du projet.",
  "Aucune publicité, aucun abonnement, aucun paiement, aucune affiliation : les liens sortants sont nettoyés de leurs paramètres de campagne.",
  "Aucun contournement de mesure technique de protection, aucun téléchargement d'un flux protégé.",
];

export default function CreditsPage() {
  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">Crédits et droits</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="mt-4 text-sm leading-relaxed">
          Cette page dit d&apos;où vient chaque élément affiché et à quel titre
          il l&apos;est. Elle décrit le fonctionnement réel de
          l&apos;application ; elle ne constitue pas un avis juridique.
        </p>
      </header>

      <section aria-labelledby="nature" className="flex flex-col gap-3">
        <h2 id="nature" className="metal-title text-lg">
          Un projet documentaire et non lucratif
        </h2>
        <p className="text-sm leading-relaxed">
          Helleilla Exploratium est une encyclopédie collaborative. Elle ne vend
          rien, n&apos;affiche aucune publicité, ne perçoit aucune commission
          d&apos;affiliation et ne revend aucune donnée. Son objet est de{" "}
          <strong>documenter</strong> et de <strong>renvoyer</strong> vers les
          diffuseurs légitimes — ce qui bénéficie aux ayants droit plutôt que de
          leur nuire.
        </p>
        <p className="text-sm leading-relaxed">
          Cette absence totale de monétisation n&apos;est pas un argument
          rhétorique : c&apos;est un fait vérifiable dans le code, qui ne
          contient ni régie publicitaire, ni traceur, ni passerelle de paiement.
        </p>
      </section>

      <section aria-labelledby="medias" className="flex flex-col gap-3">
        <h2 id="medias" className="metal-title text-lg">
          Les médias restent chez leurs diffuseurs
        </h2>
        <p className="text-sm leading-relaxed">
          Les pochettes, photos et extraits affichés ne sont{" "}
          <strong>jamais</strong> hébergés ici. La base ne conserve qu&apos;une
          adresse ; c&apos;est le navigateur du lecteur qui va chercher le
          fichier chez la plateforme d&apos;origine, laquelle reste maîtresse de
          sa diffusion et peut la retirer à tout instant. Les extraits sonores
          sont ceux que les plateformes publient elles-mêmes à des fins de
          découverte, dans leur format et leur durée.
        </p>
        <p className="text-sm leading-relaxed">
          Les droits sur ces éléments demeurent intégralement ceux de leurs
          titulaires : artistes, photographes, labels, éditeurs. Leur affichage
          ici ne vaut ni cession, ni licence, ni revendication de quelque droit
          que ce soit.
        </p>
        <ul className="mt-1 flex flex-col gap-2">
          {NOT_DONE.map((item) => (
            <li key={item} className="metal-card px-4 py-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cadre" className="flex flex-col gap-3">
        <h2 id="cadre" className="metal-title text-lg">
          Cadre juridique invoqué
        </h2>
        <p className="text-sm leading-relaxed">
          Les <strong>faits</strong> — noms, dates, formations, listes de titres
          — ne sont pas protégés par le droit d&apos;auteur : c&apos;est leur
          mise en forme qui peut l&apos;être, et celle publiée ici est rédigée
          par les contributeurs.
        </p>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed">
          <li>
            <strong>France</strong> — courte citation à fin d&apos;information
            et d&apos;analyse, avec mention de la source et de l&apos;auteur
            (article L.122-5 du Code de la propriété intellectuelle).
          </li>
          <li>
            <strong>Union européenne</strong> — exceptions de citation, de
            critique et de compte rendu prévues par la directive 2001/29/CE, et
            fouille de textes et de données à des fins non commerciales
            (directive 2019/790).
          </li>
          <li>
            <strong>États-Unis</strong> — usage transformatif, non commercial et
            sans substitution au marché de l&apos;œuvre (<em>fair use</em>, 17
            U.S.C. §107).
          </li>
          <li>
            <strong>International</strong> — convention de Berne, article 10,
            qui autorise les citations licites conformes aux bons usages.
          </li>
        </ul>
      </section>

      <section aria-labelledby="sources" className="flex flex-col gap-3">
        <h2 id="sources" className="metal-title text-lg">
          Sources de données
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
          Signalement et retrait
        </h2>
        <p className="text-sm leading-relaxed">
          Un ayant droit qui souhaite qu&apos;une référence soit retirée
          n&apos;a pas à engager de procédure : la demande suffit. Indiquez
          l&apos;adresse de la page et l&apos;élément concerné, et la référence
          sera supprimée sans discussion préalable. Comme rien n&apos;est
          hébergé ici, le retrait est immédiat et définitif.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Une contribution jugée non vérifiable peut aussi être signalée par
          n&apos;importe quel lecteur : elle repasse alors en relecture.
        </p>
      </section>

      <section aria-labelledby="explorer" className="flex flex-col gap-3">
        <h2 id="explorer" className="metal-title text-lg">
          Aller plus loin
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
