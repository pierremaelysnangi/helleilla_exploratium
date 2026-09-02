/**
 * <Footer> — pied de page global (Server Component, statique).
 *
 * Porte l'essentiel en une ligne — les médias appartiennent à leurs
 * ayants droit, le projet ne monétise rien — et renvoie vers /credits
 * pour le détail des sources, du cadre invoqué et de la procédure de
 * retrait. Cette mention doit figurer sur TOUTES les pages : c'est ce
 * qu'on cite en premier face à un signalement.
 */

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-border bg-background/60 border-t">
      <div className="text-muted-foreground site-container flex flex-col gap-2 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="metal-title text-sm">Helleilla Exploratium</span> —
          encyclopédie collaborative du metal.
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span>
            Médias © leurs ayants droit, diffusés par leurs plateformes
            officielles — rien n&apos;est hébergé ici.
          </span>
          <span aria-hidden>·</span>
          <span>Projet documentaire sans publicité ni monétisation.</span>
          <span aria-hidden>·</span>
          <Link href="/credits" className="hover:text-foreground underline">
            Crédits et droits
          </Link>
          <span aria-hidden>·</span>
          <Link href="/about" className="hover:text-foreground underline">
            À propos
          </Link>
        </p>
      </div>
    </footer>
  );
}
