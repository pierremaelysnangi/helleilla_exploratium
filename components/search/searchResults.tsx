"use client";

/**
 * <SearchResults> — résultats de la recherche globale groupés.
 *
 * Consomme `useGlobalSearch` (debounce 300 ms) et affiche trois
 * sections : groupes, albums, pistes. Albums et pistes sont rendus en
 * cartes avec leur pochette : un titre seul ne se reconnaît pas, une
 * pochette si.
 *
 * Les liens d'album étaient auparavant construits comme
 * `/bands/{slug-de-l-album}` — une adresse qui n'existe pas et menait
 * systématiquement à une 404. Le document indexé porte désormais le slug
 * du groupe, seul moyen d'écrire l'URL band-scopée correcte.
 */

// Hook de recherche debouncée + types du DTO
import { useGlobalSearch } from "@/hooks/use-search";
import Link from "next/link";
import { CoverImage } from "@/components/albums/coverImage";
import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

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
  const t = useT();
  const trimmed = q.trim();
  const { data, isFetching, isPending } = useGlobalSearch({
    q: trimmed,
    limit: 10,
    debounceMs: 300,
  });

  if (!trimmed) {
    return <p className="text-muted-foreground text-sm">{t.search.prompt}</p>;
  }

  if (isPending) {
    return (
      <p className="text-muted-foreground text-sm">{t.search.searching}</p>
    );
  }

  const empty =
    !data ||
    (data.bands.length === 0 &&
      data.albums.length === 0 &&
      data.tracks.length === 0);

  if (empty && !isFetching) {
    return (
      <p className="text-muted-foreground text-sm">
        {interpolate(t.search.noResultFor, { term: trimmed })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Indicateur discret pendant les requêtes en arrière-plan */}
      {isFetching && (
        <p aria-live="polite" className="text-muted-foreground text-xs">
          {t.search.refreshing}
        </p>
      )}

      {/* Groupes */}
      {data && data.bands.length > 0 && (
        <section>
          <SectionHeader label={t.nav.bands} count={data.bands.length} />
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
                      {interpolate(t.festival.since, { year: band.formedYear })}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Albums -> URL band-scopée, la seule qui désigne un album */}
      {data && data.albums.length > 0 && (
        <section>
          <SectionHeader label={t.nav.albums} count={data.albums.length} />
          <ul className="3xl:grid-cols-8 mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {data.albums.map((album, index) => (
              <li key={album.id}>
                <Link
                  href={`/bands/${album.bandSlug}/albums/${album.slug}`}
                  className="metal-card hover:bg-accent/30 group block overflow-hidden"
                >
                  <span className="bg-muted relative block aspect-square w-full">
                    <CoverImage
                      src={album.coverUrl}
                      title={album.title}
                      bandImageUrl={album.bandImageUrl}
                      bandName={album.bandName}
                      priority={index < 6}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    />
                  </span>
                  <span className="flex flex-col gap-1 p-3">
                    <span className="truncate text-sm font-semibold">
                      {album.title}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {album.bandName}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      {album.releaseYear !== null && (
                        <span className="font-mono">{album.releaseYear}</span>
                      )}
                      <span className="border-border rounded border px-1.5 py-0.5 tracking-wide uppercase">
                        {album.type}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pistes : la carte mène à l'album qui les porte. Les liens
          d'écoute vivent sur la page de l'album, où ils accompagnent la
          piste dans son contexte — les répéter ici encombrait la grille
          sans rien ajouter. */}
      {data && data.tracks.length > 0 && (
        <section>
          <SectionHeader label={t.album.tracklist} count={data.tracks.length} />
          <ul className="3xl:grid-cols-8 mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {data.tracks.map((track) => (
              <li key={track.id} className="metal-card overflow-hidden">
                <Link
                  href={`/bands/${track.bandSlug}/albums/${track.albumSlug}`}
                  className="hover:bg-accent/30 group block"
                >
                  <span className="bg-muted relative block aspect-square w-full">
                    <CoverImage
                      src={track.coverUrl}
                      title={track.albumTitle}
                      bandImageUrl={track.bandImageUrl}
                      bandName={track.bandName}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    />
                  </span>
                  <span className="flex flex-col gap-1 p-3">
                    <span className="truncate text-sm font-semibold">
                      {track.title}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {`${track.bandName} · ${track.albumTitle}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
