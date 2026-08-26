/**
 * <LoadingSkeleton> — squelette de chargement générique réutilisable :
 * grille de blocs animés (pulse) pendant les requêtes initiales.
 */

// Squelette shadcn
import { Skeleton } from "@/components/ui/skeleton";

type LoadingSkeletonProps = {
  /** Nombre de blocs à afficher. */
  count?: number;
  /** Hauteur de chaque bloc en px (défaut 96). */
  height?: number;
};

export function LoadingSkeleton({
  count = 6,
  height = 96,
}: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} style={{ height }} className="rounded-lg" />
      ))}
    </div>
  );
}
