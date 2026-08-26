"use client";

/**
 * <SearchResults> — résultats de la recherche globale groupés.
 * Consomme `useGlobalSearch` (debounce 300 ms) et affiche trois
 * sections : groupes, albums, pistes — avec liens vers les pages détail.
 */

// Hook de recherche debouncée + types du DTO
import { useGlobalSearch } from "@/hooks/use-search";
import Link from "next/link";

type SearchResultsProps = {
  /** Terme brut saisi (le debounce est géré par le hook). */
  q: string;
};

/** En-tête de section avec compteur. */
function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <h3 className="metal-title flex items-center gap-2 text-sm">
      {label}
      <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 font-mono text-xs">
        {count}
      </span>
    </h3>
  );
}

export function SearchResults({ q }: SearchResultsProps) {
  const trimmed = q.trim();
  const { data, isFetching, isPending } = useGlobalSearch({
    q: trimmed,
    limit: 10,
    debounceMs: 300,
  });

  if (!trimmed) {
    return (
      <p className="text-muted-foreground text-sm">
        Saisissez un terme pour lancer la recherche dans les groupes, albums et
        pistes.
      </p>
    );
  }

  if (isPending) {
    return <p className="text-muted-foreground text-sm">Recherche…</p>;
  }

  const empty =
    !data ||
    (data.bands.length === 0 &&
      data.albums.length === 0 &&
      data.tracks.length === 0);

  if (empty && !isFetching) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun résultat pour «&nbsp;{trimmed}&nbsp;».
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Indicateur discret pendant les requêtes en arrière-plan */}
      {isFetching && (
        <p aria-live="polite" className="text-muted-foreground text-xs">
          Actualisation…
        </p>
      )}

      {/* Groupes */}
      {data && data.bands.length > 0 && (
        <section>
          <SectionHeader label="Groupes" count={data.bands.length} />
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {data.bands.map((band) => (
              <li key={band.id}>
                <Link
                  href={`/bands/${band.slug}`}
                  className="metal-card hover:bg-accent/30 block p-3"
                >
                  <span className="font-medium">{band.name}</span>
                  {band.formedYear && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      depuis {band.formedYear}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Albums -> page groupe (slug album unique par groupe) */}
      {data && data.albums.length > 0 && (
        <section>
          <SectionHeader label="Albums" count={data.albums.length} />
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {data.albums.map((album) => (
              <li key={album.id}>
                <Link
                  href={`/bands/${album.slug}`}
                  className="metal-card hover:bg-accent/30 block p-3"
                >
                  <span className="font-medium">{album.title}</span>
                  <span className="text-muted-foreground ml-2 text-xs uppercase">
                    {album.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pistes -> recherche plateforme directe (pas de page détail piste) */}
      {data && data.tracks.length > 0 && (
        <section>
          <SectionHeader label="Pistes" count={data.tracks.length} />
          <ul className="divide-border border-border mt-2 divide-y rounded-lg border">
            {data.tracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center justify-between gap-3 px-4 py-2"
              >
                <span className="min-w-0 truncate text-sm">{track.title}</span>
                <a
                  href={`https://www.deezer.com/search/${encodeURIComponent(track.title)}/track`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="metal-nav-link text-xs"
                >
                  Écouter ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
