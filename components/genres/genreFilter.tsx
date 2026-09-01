"use client";

/**
 * <GenreFilter> — champ de filtre du catalogue des genres.
 *
 * Composant contrôlé : il ne détient pas l'état, il l'expose. La liste
 * complète des genres tenant en une page, le filtrage reste local à
 * l'appelant plutôt que de repasser par l'API à chaque frappe.
 */

type GenreFilterProps = {
  /** Valeur courante du filtre. */
  value: string;
  /** Appelé à chaque frappe avec la nouvelle valeur. */
  onChange: (value: string) => void;
  /** Nombre de genres visibles après filtrage, annoncé aux lecteurs d'écran. */
  resultCount?: number;
};

export function GenreFilter({
  value,
  onChange,
  resultCount,
}: GenreFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type="search"
        placeholder="Filtrer les genres…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filtrer les genres"
        aria-describedby={resultCount === undefined ? undefined : "genre-count"}
        className="border-border bg-card focus:border-primary/50 w-full max-w-xs rounded-md border px-3 py-2 text-sm outline-none"
      />
      {/* aria-live : le nombre de résultats est annoncé sans voler le focus */}
      {resultCount !== undefined && (
        <p
          id="genre-count"
          aria-live="polite"
          className="text-muted-foreground text-xs"
        >
          {resultCount} {resultCount > 1 ? "genres" : "genre"}
          {value ? ` pour « ${value} »` : ""}
        </p>
      )}
    </div>
  );
}
