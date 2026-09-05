"use client";

/**
 * <CatalogueBandPicker> — trouver le groupe à corriger.
 *
 * Une recherche plutôt qu'une liste complète : le catalogue est destiné
 * à grossir, et une grille de plusieurs milliers d'entrées ne rend pas
 * plus facile de retrouver celle qu'on cherche.
 */

import { useState } from "react";
import Link from "next/link";
import { useBands } from "@/hooks/use-bands";
import { useDebounce } from "@/hooks/use-debounce";
import { useT } from "@/lib/i18n/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FIELD_CLASS, FormError } from "@/components/shared/formField";

export function CatalogueBandPicker() {
  const t = useT();
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 300);
  const bands = useBands({ q: debounced || undefined, perPage: 20 });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t.catalogue.searchBand}
          aria-label={t.catalogue.searchBand}
          className={`${FIELD_CLASS} max-w-xs`}
        />
        <Link
          href="/admin/catalogue/groupes/nouveau"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:opacity-90"
        >
          {t.admin.newBand}
        </Link>
      </div>

      {bands.isPending && <Skeleton className="h-40" />}
      {bands.isError && <FormError>{bands.error.message}</FormError>}

      {bands.isSuccess && (
        <ul className="flex flex-col gap-2">
          {bands.data.data.map((band) => (
            <li key={band.id}>
              <Link
                href={`/admin/catalogue/groupes/${band.id}`}
                className="metal-card hover:bg-accent/30 flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <span className="text-sm font-medium">{band.name}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {band.slug}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
