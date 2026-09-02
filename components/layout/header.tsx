/**
 * <Header> — en-tête global du site (Server Component).
 *
 * Deux dispositions selon la largeur :
 * - à partir de `lg`, le titre à gauche, la navigation au centre et la
 *   session à droite ;
 * - en dessous (smartphone et tablette), le titre à gauche et un bouton
 *   burger à droite, qui déplie liens et actions en liste.
 *
 * Sticky avec fond translucide flouté pour rester lisible au défilement.
 */

// Navigation principale de bureau (client : route active)
import { Nav } from "./nav";
// Navigation repliée pour smartphone et tablette
import { MobileNav } from "./mobileNav";
// Zone authentifiée (client)
import { UserMenu } from "./userMenu";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="site-container flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 sm:gap-x-4">
        {/* Titre du site, toujours à gauche */}
        <Link href="/" className="metal-title text-lg sm:text-xl">
          Helleilla
        </Link>

        {/* Navigation centrale (grand écran) */}
        <div className="hidden lg:block">
          <Nav />
        </div>

        {/* Zone droite : session (grand écran) */}
        <div className="hidden items-center gap-3 lg:flex">
          <UserMenu />
        </div>

        {/* Burger : le panneau déplié occupe toute la largeur grâce à
            `basis-full`, sous la ligne du titre. */}
        <MobileNav>
          <UserMenu />
        </MobileNav>
      </div>
    </header>
  );
}
