/**
 * État de chargement de la fiche d'un album.
 *
 * La page n'est plus servie depuis un cache : elle attend la réponse de
 * l'API, sans quoi elle pouvait s'afficher avec une tracklist vide — un
 * instantané pris avant l'import des pistes — qu'il fallait recharger
 * pour corriger.
 *
 * Ce squelette reproduit la disposition réelle (pochette, en-tête, puis
 * tracklist et critiques côte à côte) pour que rien ne se déplace au
 * moment où le contenu arrive.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "@/lib/i18n/server";

export default async function AlbumLoading() {
  const { t } = await getTranslations();
  return (
    <div className="flex flex-col gap-8" aria-busy>
      {/* Annonce l'attente : un squelette seul n'est pas perçu par un
          lecteur d'écran. */}
      <p role="status" className="sr-only">
        {t.app.loadingAlbum}
      </p>

      <Skeleton className="h-4 w-64" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Skeleton className="h-56 w-56 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-72" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    </div>
  );
}
