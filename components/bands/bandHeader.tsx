"use client";

/**
 * <BandHeader> — en-tête héro du détail d'un groupe (Server-friendly).
 * Reçoit le détail validé (`bandDetailSchema`) : image/logo, nom,
 * pays, période, thèmes des textes, genres cliquables et bio locale.
 */

// Image optimisée + lien genres
import Image from "next/image";
import Link from "next/link";
import type { BandDetail } from "@/hooks/api/schemas";
import { ArtworkFallback } from "@/components/media/artworkFallback";
import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { translateTheme } from "@/lib/i18n/themes";

type BandHeaderProps = {
  band: BandDetail;
};

export function BandHeader({ band }: BandHeaderProps) {
  const t = useT();
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {/* Visuel principal, ou repli neutre si aucune source n'en a fourni */}
      {band.imageUrl ? (
        <Image
          src={band.imageUrl}
          alt={interpolate(t.band.photoCredit, { band: band.name })}
          width={128}
          height={128}
          priority
          className="border-border h-32 w-32 rounded-lg border object-cover"
        />
      ) : (
        <ArtworkFallback
          kind="band"
          label={band.name}
          className="h-32 w-32 shrink-0 rounded-lg"
        />
      )}

      <div className="min-w-0 flex-1">
        <h1 className="metal-title text-3xl sm:text-4xl">{band.name}</h1>
        <div className="metal-rule mt-2 w-48" />

        {/* Métadonnées : pays, période d'activité */}
        <p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {band.countryCode && (
            <span className="border-border rounded border px-2 py-0.5 font-mono text-xs">
              {band.countryCode}
            </span>
          )}
          {/* « actif » plutôt qu'une ellipse : l'absence de date de fin
              est une information, pas une donnée manquante. */}
          <span>
            {interpolate(t.band.period, {
              from: band.formedYear ?? t.band.unknownYear,
              to: band.dissolvedYear
                ? `${band.dissolvedYear} (${t.band.disbanded})`
                : t.band.active,
            })}
          </span>
        </p>

        {/* Thèmes des textes : caractérisent le propos du groupe, que
            les genres seuls ne disent pas. Aucune parole n'est reproduite. */}
        {band.themes && band.themes.length > 0 && (
          <p className="text-muted-foreground mt-3 text-sm">
            <span className="tracking-wide uppercase">{t.band.themes}</span>
            {" · "}
            {/* Vocabulaire fermé : les thèmes se traduisent, contrairement
                aux noms de genres. */}
            {band.themes.map((theme) => translateTheme(t, theme)).join(", ")}
          </p>
        )}

        {/* Genres associés -> page du genre (slug unique globalement) */}
        {band.genres.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={t.band.genres}>
            {band.genres.map((genre) => (
              <li key={genre.id}>
                <Link
                  href={`/genres/${genre.slug}`}
                  className="border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase transition-colors"
                >
                  {genre.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Bio saisie localement */}
        {band.bio && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed">{band.bio}</p>
        )}
      </div>
    </header>
  );
}
