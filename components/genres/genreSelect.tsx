"use client";

/**
 * <GenreSelect> — filtre par genre, partagé par le catalogue des
 * groupes, celui des albums et la recherche.
 *
 * Les sous-genres sont regroupés sous leur famille (`<optgroup>`) : à
 * plus de soixante entrées, une liste à plat oblige à connaître la
 * taxonomie par cœur pour y retrouver quoi que ce soit.
 *
 * Choisir une famille inclut ses sous-genres côté API : c'est la
 * lecture attendue d'un filtre hiérarchique.
 */

import { useGenreTaxonomy } from "@/hooks/use-genres";

type GenreSelectProps = {
  /** Slug sélectionné, ou chaîne vide pour « tous les genres ». */
  value: string;
  onChange: (slug: string) => void;
  /** Libellé accessible, adapté à la liste filtrée. */
  label?: string;
};

export function GenreSelect({
  value,
  onChange,
  label = "Filtrer par genre",
}: GenreSelectProps) {
  const { families, isPending } = useGenreTaxonomy();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      disabled={isPending}
      className="border-border bg-card rounded-md border px-3 py-2 text-sm"
    >
      <option value="">Tous les genres</option>
      {families.map(({ root, children }) => (
        <optgroup key={root.id} label={root.name}>
          {/* La famille elle-même reste sélectionnable : elle englobe
              alors ses sous-genres. */}
          <option value={root.slug}>{root.name} (tout)</option>
          {children.map((child) => (
            <option key={child.id} value={child.slug}>
              {child.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
