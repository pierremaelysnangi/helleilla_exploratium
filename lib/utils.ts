/**
 * Utilitaires partagés de l'application.
 * Contient la fonction classique `cn()` de fusion des classes Tailwind,
 * utilisée par les composants UI (shadcn/ui).
 */

// clsx : construction conditionnelle de chaînes de classes CSS
import { clsx, type ClassValue } from "clsx";
// tailwind-merge : résout les conflits entre classes Tailwind (dernière prioritaire)
import { twMerge } from "tailwind-merge";

/**
 * Fusionne plusieurs listes de classes Tailwind en une seule chaîne propre.
 * @param inputs Classes conditionnelles ou tableaux de classes.
 * @returns La chaîne de classes fusionnée sans conflits.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
