"use client";

/**
 * Frontière d'erreur du segment /genres/[slug] : isole la panne à ce
 * sous-arbre plutôt que de faire tomber toute l'application.
 */

import { ErrorFallback } from "@/components/shared/errorFallback";

export default function GenreErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} scope="ce genre" />;
}
