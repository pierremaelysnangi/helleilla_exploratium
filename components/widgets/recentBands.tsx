/**
 * <RecentBands> — derniers groupes entrés au catalogue.
 *
 * Réutilise <BandCard> plutôt qu'une carte dédiée : deux rendus différents
 * pour la même entité créeraient une incohérence visible d'une page à
 * l'autre.
 */

import { BandCard } from "@/components/bands/bandCard";
import type { BandRow } from "@/hooks/api/schemas";

export function RecentBands({
  bands,
  title,
}: {
  bands: BandRow[];
  title: string;
}) {
  if (bands.length === 0) return null;

  return (
    <section aria-labelledby="derniers-groupes" className="flex flex-col gap-3">
      <h2 id="derniers-groupes" className="metal-title text-lg">
        {title}
      </h2>
      <ul className="3xl:grid-cols-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {bands.map((band) => (
          <li key={band.id}>
            <BandCard band={band} />
          </li>
        ))}
      </ul>
    </section>
  );
}
