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

/** Entrées de navigation : libellé FR + route. */
const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/bands", label: "Groupes" },
  { href: "/albums", label: "Albums" },
  { href: "/genres", label: "Genres" },
  { href: "/search", label: "Recherche" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
        {LINKS.map(({ href, label }) => {
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
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
