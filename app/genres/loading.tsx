/**
 * État de chargement de la taxonomie des genres.
 * Forme « liste » : la page rend une grille de cartes.
 */

import { LoadingSkeleton } from "@/components/shared/loadingSkeleton";

export default function Loading() {
  return <LoadingSkeleton count={8} />;
}
