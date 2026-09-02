/**
 * État de chargement de la résolution d'un album.
 * Forme « détail » : visuel, titre, métadonnées puis contenu.
 */

import { DetailSkeleton } from "@/components/shared/loadingSkeleton";

export default function Loading() {
  return <DetailSkeleton />;
}
