"use client";

/**
 * <ArtworkFallback> — visuel de repli quand aucune image n'est
 * disponible pour une entité.
 *
 * Remplace le monogramme (première lettre sur fond plein) qui parsemait
 * l'interface : une initiale n'est pas un visuel, elle se répète et donne
 * l'impression d'un catalogue vide. Un pictogramme neutre sur fond
 * texturé se lit comme un état, pas comme une illustration.
 *
 * Aucun média n'est produit ici : le motif est un dégradé CSS et une
 * icône vectorielle d'interface, ce que la règle du projet autorise
 * explicitement (les médias restent référencés depuis les plateformes).
 */

import { Disc3, Users, Music4 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

/** Nature de l'entité représentée : détermine le pictogramme. */
export type ArtworkKind = "band" | "album" | "track";

const ICONS = {
  band: Users,
  album: Disc3,
  track: Music4,
} as const;

type ArtworkFallbackProps = {
  kind: ArtworkKind;
  /** Nom de l'entité, utilisé pour l'accessibilité uniquement. */
  label: string;
  /** Classes de dimensionnement héritées de l'appelant. */
  className?: string;
};

export function ArtworkFallback({
  kind,
  label,
  className = "",
}: ArtworkFallbackProps) {
  const t = useT();
  const Icon = ICONS[kind];

  return (
    <span
      role="img"
      aria-label={interpolate(t.common.noVisual, { name: label })}
      className={
        "from-muted via-muted/60 to-background text-muted-foreground/50 " +
        "border-border flex items-center justify-center border " +
        "bg-gradient-to-br " +
        className
      }
    >
      <Icon
        aria-hidden
        className="h-[38%] max-h-16 w-auto"
        strokeWidth={1.25}
      />
    </span>
  );
}
