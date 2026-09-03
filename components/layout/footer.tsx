/**
 * <Footer> — pied de page global (Server Component, statique).
 *
 * Présent sur toutes les pages : c'est lui qu'on cite en premier face à
 * un signalement, d'où la mention des droits et le lien vers les
 * crédits.
 */

import Link from "next/link";

/** Colonnes de liens du pied de page. */
const COLUMNS = [
  {
    title: "Explorer",
    links: [
      { href: "/bands", label: "Groupes" },
      { href: "/albums", label: "Albums" },
      { href: "/genres", label: "Genres" },
      { href: "/search", label: "Recherche" },
    ],
  },
  {
    title: "Participer",
    links: [
      { href: "/contributions", label: "Proposer une fiche" },
      { href: "/contributions/mes-dossiers", label: "Mes contributions" },
      { href: "/sign-up", label: "Créer un compte" },
    ],
  },
  {
    title: "Le projet",
    links: [
      { href: "/about", label: "À propos" },
      { href: "/credits", label: "Crédits et droits" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-border bg-background/60 mt-8 border-t">
      <div className="site-container flex flex-col gap-8 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="metal-title text-sm">Helleilla Exploratium</span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Une encyclopédie du metal écrite par ceux qui l&apos;écoutent.
              Groupes, discographies, genres — et de quoi remonter à la source
              de chaque information.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold tracking-widest uppercase">
                {column.title}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-border/60 text-muted-foreground flex flex-col gap-2 border-t pt-6 text-xs">
          <p>
            Pochettes et photos appartiennent à leurs auteurs et à leurs ayants
            droit. Rien n&apos;est hébergé ici : tout est affiché depuis sa
            source d&apos;origine, à titre d&apos;illustration.
          </p>
          <p>
            Projet sans publicité, sans abonnement et sans revenus.{" "}
            <Link
              href="/credits"
              className="hover:text-foreground underline underline-offset-4"
            >
              Sources et droits
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
