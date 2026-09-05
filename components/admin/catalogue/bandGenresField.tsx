"use client";

/**
 * <BandGenresField> — rattachement d'un groupe à ses genres.
 *
 * Cases à cocher groupées par famille plutôt qu'une liste déroulante
 * multiple : un groupe porte souvent trois ou quatre genres, et une
 * sélection multiple au clavier (Ctrl+clic) se défait au moindre clic
 * de travers, sans confirmation ni retour en arrière.
 *
 * L'enregistrement REMPLACE l'ensemble, comme la route qu'il appelle :
 * décocher est donc une action à part entière, et non un oubli.
 */

import { useState } from "react";
import { useGenreTaxonomy } from "@/hooks/use-genres";
import { useSyncBandGenres } from "@/hooks/use-bands";
import { useT } from "@/lib/i18n/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitButton, FormError } from "@/components/shared/formField";

export function BandGenresField({
  bandId,
  /** Genres déjà rattachés, tels que servis par la fiche. */
  current,
}: {
  bandId: string;
  current: { id: string }[];
}) {
  const t = useT();
  const { families, isPending } = useGenreTaxonomy();
  const sync = useSyncBandGenres(bandId);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(current.map((genre) => genre.id)),
  );

  if (isPending) return <Skeleton className="h-40" />;

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        sync.mutate([...selected]);
      }}
    >
      <div className="max-h-80 overflow-y-auto pr-2">
        <ul className="flex flex-col gap-3">
          {families.map(({ root, children }) => (
            <li key={root.id}>
              <fieldset>
                <legend className="text-muted-foreground text-xs tracking-wide uppercase">
                  {root.name}
                </legend>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {[root, ...children].map((genre) => (
                    <label
                      key={genre.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(genre.id)}
                        onChange={() => toggle(genre.id)}
                      />
                      {genre.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </li>
          ))}
        </ul>
      </div>

      {sync.isError && <FormError>{sync.error.message}</FormError>}
      {sync.isSuccess && (
        <p role="status" className="text-muted-foreground text-sm">
          {t.admin.saved}
        </p>
      )}

      <SubmitButton pending={sync.isPending}>
        {sync.isPending ? t.app.saving : t.app.save}
      </SubmitButton>
    </form>
  );
}
