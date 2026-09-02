/**
 * État de chargement de la page d'un genre.
 * Forme « détail » : visuel, titre, métadonnées puis contenu.
 */

import { DetailSkeleton } from "@/components/shared/loadingSkeleton";

export default function Loading() {
  return <DetailSkeleton />;
}
