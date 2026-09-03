"use client";

/**
 * Squelettes de chargement partagés par les `loading.tsx`.
 *
 * Composants CLIENTS bien qu'ils n'aient aucun état : leur libellé
 * accessible doit être traduit, et un `loading.tsx` ne peut pas résoudre
 * la langue lui-même — lire le cookie depuis un repli de Suspense
 * rendrait dynamique la route entière, ce que ce repli existe justement
 * pour éviter. Le dictionnaire descend donc par le contexte.
 *
 * Les six fichiers de segment rendaient chacun leur propre balisage, à peu
 * près identique : une correction d'accessibilité devait alors être
 * répétée six fois. Chaque segment déclare désormais SA FORME (liste ou
 * détail), le rendu est mutualisé.
 */

// Squelette shadcn
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";

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
  const t = useT();
  return (
    <div
      role="status"
      aria-label={t.common.loadingInProgress}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} style={{ height }} className="rounded-lg" />
      ))}
    </div>
  );
}

/**
 * <DetailSkeleton> — silhouette d'une page détail : visuel, titre, méta,
 * puis un bloc de contenu.
 *
 * Reproduit grossièrement la mise en page réelle plutôt qu'un rectangle
 * générique : un squelette qui ne préfigure rien ne réduit pas le
 * sentiment d'attente, il le déplace.
 */
export function DetailSkeleton() {
  const t = useT();
  return (
    <div
      role="status"
      aria-label={t.common.loadingInProgress}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-32 w-32 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-9 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
