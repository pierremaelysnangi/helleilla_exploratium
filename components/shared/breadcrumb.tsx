/**
 * <Breadcrumb> — fil d'Ariane partagé.
 *
 * Quatre pages en dessinaient chacune le sien, avec le même séparateur
 * et le même `aria-label` recopiés : la moitié d'entre eux étaient
 * restés en français au moment de la traduction. Un seul composant,
 * un seul libellé à traduire.
 */

import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = {
  /** Absent sur le dernier élément : on n'y renvoie pas, on y est. */
  href?: string;
  label: ReactNode;
};

export function Breadcrumb({
  label,
  items,
}: {
  /** Libellé accessible de la navigation, traduit. */
  label: string;
  items: Crumb[];
}) {
  return (
    <nav aria-label={label} className="text-muted-foreground text-sm">
      {items.map((item, index) => (
        <span key={index}>
          {/* Séparateur masqué aux lecteurs d'écran : la structure de
              liste suffit à les renseigner. */}
          {index > 0 && <span aria-hidden> / </span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
