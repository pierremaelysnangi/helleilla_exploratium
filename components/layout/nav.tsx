"use client";

/**
 * <Nav> — navigation principale du site.
 * Lien actif surligné selon la route courante (usePathname).
 *
 * Rendu uniquement à partir de `lg` : en dessous, la navigation passe
 * par <MobileNav> et son bouton burger.
 */

// Détection de la route active
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Entrées de navigation : route + clé de traduction du libellé. */
const LINKS = [
  { href: "/", key: "home" },
  { href: "/bands", key: "bands" },
  { href: "/albums", key: "albums" },
  { href: "/genres", key: "genres" },
  { href: "/festivals", key: "festivals" },
  { href: "/forums", key: "forums" },
  { href: "/presse", key: "press" },
  { href: "/search", key: "search" },
] as const;

export function Nav({ t }: { t: Dictionary }) {
  const pathname = usePathname();

  return (
    <nav aria-label={t.nav.mainNavigation}>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
        {LINKS.map(({ href, key }) => {
          // Actif si route exacte (accueil) ou sous-route (/bands/...)
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`metal-nav-link ${active ? "metal-nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {t.nav[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
