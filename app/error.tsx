"use client";

/**
 * Frontière d'erreur du segment racine.
 * Le rendu est partagé avec les frontières locales (`<ErrorFallback>`) :
 * un même incident doit se présenter de la même façon partout.
 */

import { ErrorFallback } from "@/components/shared/errorFallback";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}
