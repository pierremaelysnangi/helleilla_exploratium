"use client";

/**
 * <MobileNav> — navigation repliée derrière un bouton burger, sur
 * smartphone et tablette.
 *
 * Auparavant les cinq liens de navigation s'empilaient sous l'en-tête :
 * ils consommaient deux lignes en permanence, sur toutes les pages, pour
 * une navigation dont on ne se sert que ponctuellement. Le burger rend
 * l'espace au contenu.
 *
 * Le panneau est rendu en flux normal, sous l'en-tête sticky, plutôt
 * qu'en overlay : pas de piège de focus à gérer, pas de blocage du
 * défilement, et le comportement reste correct si JavaScript échoue à
 * s'hydrater (le panneau est simplement fermé).
 */

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/** Entrées de navigation : mêmes cibles que la navigation de bureau. */
const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/bands", label: "Groupes" },
  { href: "/albums", label: "Albums" },
  { href: "/genres", label: "Genres" },
  { href: "/search", label: "Recherche" },
] as const;

type MobileNavProps = {
  /** Zone de session, listée sous les liens une fois le menu ouvert. */
  children: React.ReactNode;
};

export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  // Une navigation réussie doit refermer le menu : sans cela, la page
  // demandée s'affiche derrière un panneau resté ouvert. L'ajustement se
  // fait PENDANT le rendu et non dans un effet : le panneau ne doit pas
  // apparaître ouvert une frame sur la nouvelle page.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  // Échap referme, comme pour tout élément surgissant.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="border-border hover:border-primary/50 flex h-9 w-9 items-center justify-center rounded-md border transition-colors lg:hidden"
      >
        {open ? (
          <X aria-hidden className="h-4 w-4" />
        ) : (
          <Menu aria-hidden className="h-4 w-4" />
        )}
      </button>

      {/* `hidden` plutôt qu'un démontage : l'identifiant référencé par
          aria-controls doit exister même panneau fermé. */}
      <div
        id={panelId}
        hidden={!open}
        className="border-border/60 basis-full border-t lg:hidden"
      >
        <nav aria-label="Navigation principale" className="py-2">
          <ul className="flex flex-col">
            {LINKS.map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`hover:bg-accent/30 block rounded-md px-2 py-2.5 text-sm tracking-wide uppercase transition-colors ${
                      active ? "text-primary font-semibold" : ""
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Session : mêmes actions que sur grand écran */}
        <div className="border-border/60 flex items-center gap-3 border-t py-3">
          {children}
        </div>
      </div>
    </>
  );
}
