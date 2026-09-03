"use client";

/**
 * <AlbumCard> — carte d'album pour les grilles (discographie, sélections).
 *
 * Composant client pour une seule raison : le TYPE de sortie est un
 * libellé traduit, et le dictionnaire descend par contexte. Le reste
 * n'a ni état ni interaction.
 *
 * Carte haut/bas : pochette carrée puis titre, groupe éventuel, année et
 * type de sortie. Le repli visuel est le même que partout ailleurs quand
 * aucune pochette officielle n'est référencée.
 */

// Lien Next + pochette avec repli (l'archive amont peut être lente)
import Link from "next/link";
import { CoverImage } from "./coverImage";
// Type de ligne validée côté client
import type { AlbumRow } from "@/hooks/api/schemas";
import { useT } from "@/lib/i18n/client";

type AlbumCardProps = {
  album: AlbumRow;
  /** Nom du groupe, affiché quand la carte sort du contexte d'une fiche. */
  bandName?: string;
  /** Visuel du groupe : repli quand aucune pochette n'est archivée. */
  bandImageUrl?: string | null;
  /**
   * Charge la pochette sans attendre le défilement.
   *
   * À réserver aux toutes premières cartes d'une grille : ce sont elles
   * qui décident du Largest Contentful Paint, et le chargement paresseux
   * par défaut retardait donc la mesure de la page entière.
   */
  priority?: boolean;
  /**
   * Slug du groupe propriétaire.
   *
   * Obligatoire : l'URL canonique d'un album est band-scopée, car son slug
   * n'est unique qu'au sein d'un groupe (contrainte `albums_band_slug_uq`).
   * Le passer explicitement évite de fabriquer un lien ambigu.
   */
  bandSlug: string;
};

export function AlbumCard({
  album,
  bandSlug,
  bandName,
  bandImageUrl,
  priority = false,
}: AlbumCardProps) {
  const t = useT();
  return (
    <Link
      href={`/bands/${bandSlug}/albums/${album.slug}`}
      className="metal-card hover:bg-accent/30 group block overflow-hidden"
    >
      {/* Pochette carrée, ou repli neutre si absente ou injoignable */}
      <div className="bg-muted relative aspect-square w-full">
        <CoverImage
          src={album.coverUrl}
          title={album.title}
          bandImageUrl={bandImageUrl}
          bandName={bandName}
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 200px, 160px"
        />
      </div>

      <div className="flex flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-semibold" title={album.title}>
          {album.title}
        </h3>
        {bandName && (
          <p className="text-muted-foreground truncate text-xs">{bandName}</p>
        )}
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          {/* Pas de tiret de remplacement : une année absente se tait. */}
          {album.releaseYear !== null && album.releaseYear !== undefined && (
            <span className="font-mono">{album.releaseYear}</span>
          )}
          <span className="border-border rounded border px-1.5 py-0.5 tracking-wide uppercase">
            {t.releaseType[album.type]}
          </span>
        </p>
      </div>
    </Link>
  );
}
