/**
 * État de chargement racine, affiché pendant la navigation vers un segment
 * qui n'a pas défini le sien.
 */

import { LoadingSkeleton } from "@/components/shared/loadingSkeleton";

export default function Loading() {
  return <LoadingSkeleton count={3} />;
}
