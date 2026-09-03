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
import { useT } from "@/lib/i18n/client";

type GenreSelectProps = {
  /** Slug sélectionné, ou chaîne vide pour « tous les genres ». */
  value: string;
  onChange: (slug: string) => void;
  /** Libellé accessible, adapté à la liste filtrée. */
  label?: string;
};

export function GenreSelect({ value, onChange, label }: GenreSelectProps) {
  const t = useT();
  const { families } = useGenreTaxonomy();
  const accessibleLabel = label ?? t.catalogue.filterByGenre;

  // Volontairement JAMAIS désactivé pendant le chargement de la
  // taxonomie. `isPending` n'a pas la même valeur au rendu serveur et à
  // l'hydratation — le serveur rend la liste peuplée, le client repart
  // d'un cache vide — ce qui produisait un écart d'attribut `disabled`
  // signalé par React. Une liste réduite à « tous les genres » est de
  // toute façon inoffensive : elle correspond déjà à la valeur en cours.
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={accessibleLabel}
      className="border-border bg-card rounded-md border px-3 py-2 text-sm"
    >
      <option value="">{t.catalogue.allGenres}</option>
      {families.map(({ root, children }) => (
        <optgroup key={root.id} label={root.name}>
          {/* La famille elle-même reste sélectionnable : elle englobe
              alors ses sous-genres. */}
          <option value={root.slug}>{root.name}</option>
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
