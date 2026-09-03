"use client";

/**
 * <GenresView> — taxonomie des genres, groupée par famille.
 *
 * Plus de champ de filtre : la recherche globale (Ctrl+K, ou /search)
 * couvre déjà ce besoin, et un second champ propre à cette page en
 * doublonnait la fonction tout en repoussant la taxonomie sous la ligne
 * de flottaison.
 *
 * La pagination est gérée par `useGenreTaxonomy` : l'API plafonne
 * `perPage` à 100, et cette vue en demandait 200 — elle recevait donc
 * une erreur de validation au lieu des genres.
 */

import { useGenreTaxonomy } from "@/hooks/use-genres";
import { GenreCard } from "./genreCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";

export function GenresView() {
  const t = useT();
  const { families, isPending, isError } = useGenreTaxonomy();

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {t.common.error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {families.map((family) => (
        <section key={family.root.id} className="flex flex-col gap-3">
          <h2 className="metal-title flex items-baseline gap-2 text-base">
            <a href={`/genres/${family.root.slug}`} className="hover:underline">
              {family.root.name}
            </a>
            {family.children.length > 0 && (
              <span className="text-muted-foreground font-mono text-xs">
                {family.children.length}
              </span>
            )}
          </h2>

          {family.children.length > 0 && (
            <ul className="3xl:grid-cols-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {family.children.map((genre) => (
                <li key={genre.id}>
                  <GenreCard genre={genre} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
