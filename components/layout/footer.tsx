/**
 * <Footer> — pied de page global (Server Component, statique).
 *
 * Présent sur toutes les pages : c'est lui qu'on cite en premier face à
 * un signalement, d'où la mention des droits et le lien vers les
 * crédits.
 */

import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { SITE_NAME } from "@/lib/site";

/**
 * Colonnes de liens, décrites par leurs CLÉS de traduction.
 *
 * Les libellés sont résolus au rendu : y écrire du français figerait le
 * pied de page dans une seule langue.
 */
const COLUMNS: {
  title: keyof Dictionary["footer"];
  links: { href: string; label: (t: Dictionary) => string }[];
}[] = [
  {
    title: "explore",
    links: [
      { href: "/bands", label: (t) => t.nav.bands },
      { href: "/albums", label: (t) => t.nav.albums },
      { href: "/genres", label: (t) => t.nav.genres },
      { href: "/search", label: (t) => t.nav.search },
    ],
  },
  {
    title: "participate",
    links: [
      { href: "/contributions", label: (t) => t.footer.proposeEntry },
      {
        href: "/contributions/mes-dossiers",
        label: (t) => t.auth.myContributions,
      },
      { href: "/sign-up", label: (t) => t.footer.createAccount },
    ],
  },
  {
    title: "project",
    links: [
      { href: "/about", label: (t) => t.footer.about },
      { href: "/credits", label: (t) => t.footer.credits },
    ],
  },
];

export function Footer({ t }: { t: Dictionary }) {
  return (
    <footer className="border-border bg-background/60 mt-8 border-t">
      <div className="site-container flex flex-col gap-8 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="metal-title text-sm">{SITE_NAME}</span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t.footer.intro}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={t.footer[column.title]}>
              <h2 className="text-xs font-semibold tracking-widest uppercase">
                {t.footer[column.title]}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label(t)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-border/60 text-muted-foreground flex flex-col gap-2 border-t pt-6 text-xs">
          <p>{t.footer.rights}</p>
          <p>
            {t.footer.noMonetisation}{" "}
            <Link
              href="/credits"
              className="hover:text-foreground underline underline-offset-4"
            >
              {t.footer.sourcesAndRights}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
