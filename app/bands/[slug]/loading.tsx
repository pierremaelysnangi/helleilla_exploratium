/**
 * État de chargement de la fiche d'un groupe.
 * Forme « détail » : visuel, titre, métadonnées puis contenu.
 */

import { DetailSkeleton } from "@/components/shared/loadingSkeleton";

export default function Loading() {
  return <DetailSkeleton />;
}
