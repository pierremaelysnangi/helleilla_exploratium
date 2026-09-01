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
  "Helleilla Exploratium est une encyclopédie musicale metal collaborative : aucun média généré par IA, des sources officielles vérifiables pour chaque contribution.";

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

/** Les trois preuves considérées comme officielles à la modération. */
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
          Une encyclopédie du metal : groupes, discographies et taxonomie des
          genres, construite collectivement et vérifiable pièce par pièce.
        </p>
      </header>

      <section aria-labelledby="regle" className="flex flex-col gap-3">
        <h2 id="regle" className="metal-title text-lg">
          Aucun média généré par IA
        </h2>
        <p className="text-sm leading-relaxed">
          C&apos;est la règle non négociable du projet. Aucune image, aucun son
          et aucune vidéo produits par un modèle génératif n&apos;entre ici. Les
          pochettes, photos et extraits affichés proviennent{" "}
          <strong>exclusivement</strong> des plateformes officielles, appelées
          au moment de l&apos;affichage : rien n&apos;est copié, rien n&apos;est
          recréé, la base ne conserve que des références.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Seule exception : les animations de l&apos;interface, qui relèvent du
          CSS et non du média.
        </p>
      </section>

      <section aria-labelledby="preuves" className="flex flex-col gap-3">
        <h2 id="preuves" className="metal-title text-lg">
          Pourquoi des preuves sont exigées
        </h2>
        <p className="text-sm leading-relaxed">
          Une encyclopédie ne vaut que par sa vérifiabilité. Toute contribution
          doit donc être accompagnée d&apos;au moins{" "}
          <strong>deux preuves</strong>, dont au minimum{" "}
          <strong>une source officielle</strong>. Cette exigence est appliquée
          par le code, pas seulement par la modération : un dossier sans source
          vérifiable n&apos;entre pas dans la file de relecture.
        </p>
        <p className="text-sm leading-relaxed">
          Cette barrière est aussi ce qui protège le projet du contenu inventé :
          un groupe fabriqué de toutes pièces ne peut pas produire de référence
          MusicBrainz ou Discogs.
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

      <section aria-labelledby="moderation" className="flex flex-col gap-3">
        <h2 id="moderation" className="metal-title text-lg">
          Comment une contribution est traitée
        </h2>
        <ol className="flex flex-col gap-2 text-sm leading-relaxed">
          <li>
            <strong>Soumission</strong> — un contributeur propose une fiche
            accompagnée de ses preuves.
          </li>
          <li>
            <strong>Relecture</strong> — un modérateur valide, ou demande des
            preuves complémentaires.
          </li>
          <li>
            <strong>Échanges</strong> — le contributeur complète son dossier ;
            sans réponse après deux relances, le dossier expire de lui-même.
          </li>
          <li>
            <strong>Rejet définitif</strong> — réservé aux administrateurs, la
            demande de preuves restant toujours préférable.
          </li>
        </ol>
      </section>

      <section aria-labelledby="explorer" className="flex flex-col gap-3">
        <h2 id="explorer" className="metal-title text-lg">
          Explorer
        </h2>
        <ul className="flex flex-wrap gap-2">
          {[
            { href: "/bands", label: "Groupes" },
            { href: "/albums", label: "Albums" },
            { href: "/genres", label: "Genres" },
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
