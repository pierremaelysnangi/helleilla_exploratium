/**
 * <AlbumCard> — carte d'album pour les grilles (discographie, sélections).
 * Composant serveur : pas d'état, pas d'interaction — il ne rend qu'un lien.
 *
 * Pendant « pochette » de <BandCard>, avec la même mécanique de repli sur
 * un monogramme quand aucune pochette officielle n'est référencée.
 */

// Lien Next + image optimisée (pochette externe si référencée)
import Link from "next/link";
import Image from "next/image";
// Type de ligne validée côté client
import type { AlbumRow } from "@/hooks/api/schemas";

/** Libellés français du type de sortie (enum PostgreSQL `album_type`). */
const TYPE_LABELS: Record<AlbumRow["type"], string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  compilation: "Compilation",
  live: "Live",
  demo: "Démo",
};

type AlbumCardProps = {
  album: AlbumRow;
  /**
   * Slug du groupe propriétaire.
   *
   * Obligatoire : l'URL canonique d'un album est band-scopée, car son slug
   * n'est unique qu'au sein d'un groupe (contrainte `albums_band_slug_uq`).
   * Le passer explicitement évite de fabriquer un lien ambigu.
   */
  bandSlug: string;
};

export function AlbumCard({ album, bandSlug }: AlbumCardProps) {
  return (
    <Link
      href={`/bands/${bandSlug}/albums/${album.slug}`}
      className="metal-card hover:bg-accent/30 group block overflow-hidden"
    >
      {/* Pochette carrée, ou monogramme sur fond acier */}
      <div className="bg-muted relative aspect-square w-full">
        {album.coverUrl ? (
          <Image
            src={album.coverUrl}
            alt={`Pochette de ${album.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden
            className="font-heading text-muted-foreground absolute inset-0 flex items-center justify-center text-4xl font-black uppercase"
          >
            {album.title.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-semibold" title={album.title}>
          {album.title}
        </h3>
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="font-mono">{album.releaseYear ?? "—"}</span>
          <span className="border-border rounded border px-1.5 py-0.5 tracking-wide uppercase">
            {TYPE_LABELS[album.type]}
          </span>
        </p>
      </div>
    </Link>
  );
}
