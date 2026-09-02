/**
 * <Header> — en-tête global du site (Server Component).
 * Compose : titre du site (lien accueil), navigation principale et
 * zone utilisateur + bascule de thème. Sticky avec fond translucide
 * flouté pour rester lisible au défilement.
 */

// Navigation principale (client : route active)
import { Nav } from "./nav";
// Bascule clair/sombre + zone authentifiée (clients)
import { ThemeToggle } from "./themeToggle";
import { UserMenu } from "./userMenu";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      {/* `flex-wrap` : sur un écran de 390 px, titre + actions de session +
          bascule de thème ne tiennent pas sur une ligne. Passer à la ligne
          vaut mieux que déborder ou masquer une action. */}
      <div className="site-container flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 sm:gap-x-4">
        {/* Titre du site */}
        <Link href="/" className="metal-title text-lg sm:text-xl">
          Helleilla
        </Link>

        {/* Navigation centrale */}
        <div className="hidden md:block">
          <Nav />
        </div>

        {/* Zone droite : session + thème */}
        <div className="flex items-center gap-3">
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>

      {/* Nav repliée sur mobile, sous le header */}
      <div className="border-border/50 border-t md:hidden">
        <div className="site-container py-2">
          <Nav />
        </div>
      </div>
    </header>
  );
}
