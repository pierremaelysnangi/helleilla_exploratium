/**
 * État de chargement du catalogue des groupes.
 * Forme « liste » : la page rend une grille de cartes.
 */

import { LoadingSkeleton } from "@/components/shared/loadingSkeleton";

export default function Loading() {
  return <LoadingSkeleton count={6} />;
}
