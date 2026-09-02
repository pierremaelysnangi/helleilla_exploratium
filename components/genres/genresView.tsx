"use client";

/**
 * <GenresView> — taxonomie des genres, groupée par famille.
 *
 * La liste était auparavant demandée en une seule page de 200 entrées,
 * ce que l'API refuse (`perPage` plafonné à 100) ; la pagination est
 * désormais gérée par `useGenreTaxonomy`, qui enchaîne les pages.
 *
 * L'affichage est groupé par famille racine : à plusieurs dizaines de
 * genres, une grille à plat ne se parcourt plus.
 */

import { useState } from "react";
import { useGenreTaxonomy } from "@/hooks/use-genres";
// Présentation extraite : champ de filtre et carte de genre
import { GenreFilter } from "./genreFilter";
import { GenreCard } from "./genreCard";

export function GenresView() {
  const [filter, setFilter] = useState("");
  const { families, genres, isPending, isError } = useGenreTaxonomy();

  const needle = filter.trim().toLowerCase();
  const matches = (name: string) => name.toLowerCase().includes(needle);

  // Une famille reste affichée si elle correspond elle-même — ses
  // sous-genres sont alors tous pertinents — ou si l'un d'eux correspond.
  const visible = families
    .map((family) => ({
      root: family.root,
      children: matches(family.root.name)
        ? family.children
        : family.children.filter((c) => matches(c.name)),
      self: matches(family.root.name),
    }))
    .filter((family) => family.self || family.children.length > 0);

  const visibleCount = visible.reduce(
    (sum, f) => sum + (f.self ? 1 : 0) + f.children.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <GenreFilter
        value={filter}
        onChange={setFilter}
        resultCount={isPending ? undefined : visibleCount}
      />

      {isPending && (
        <p className="text-muted-foreground">Chargement des genres…</p>
      )}
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          Impossible de charger les genres.
        </p>
      )}

      {visible.map((family) => (
        <section key={family.root.id} className="flex flex-col gap-3">
          <h2 className="metal-title text-base">
            <a href={`/genres/${family.root.slug}`} className="hover:underline">
              {family.root.name}
            </a>
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

      {!isPending && genres.length > 0 && visibleCount === 0 && (
        <p className="text-muted-foreground">Aucun genre ne correspond.</p>
      )}
    </div>
  );
}
