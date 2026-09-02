"use client";

/**
 * <BandCard> — carte de groupe pour les listes et grilles du catalogue.
 * Données : ligne `bandRowSchema` (hooks/api/schemas.ts) — nom, pays,
 * période d'activité, slug cliquable vers la page détail.
 */

// Lien Next + image optimisée (logo externe si présent)
import Link from "next/link";
import Image from "next/image";
// Type de ligne validée côté client
import type { BandRow } from "@/hooks/api/schemas";
import { ArtworkFallback } from "@/components/media/artworkFallback";

/** Props : la ligne de groupe à afficher. */
type BandCardProps = {
  band: BandRow;
};

/**
 * Libellé de la période d'activité : « 1991 – 2001 » ou « 1991 – actif ».
 *
 * L'absence de date de fin signifie que le groupe existe encore ; une
 * ellipse laissait croire à une donnée manquante.
 */
function activityPeriod(band: BandRow): string {
  const begin = band.formedYear ?? "?";
  return `${begin} – ${band.dissolvedYear ?? "actif"}`;
}

export function BandCard({ band }: BandCardProps) {
  return (
    <Link
      href={`/bands/${band.slug}`}
      className="metal-card hover:bg-accent/30 block p-4"
    >
      <div className="flex items-center gap-4">
        {/* Logo du groupe si connu (source officielle uniquement) */}
        {band.imageUrl ? (
          <Image
            src={band.imageUrl}
            alt={`Logo de ${band.name}`}
            width={56}
            height={56}
            className="h-14 w-14 rounded-md object-cover"
          />
        ) : (
          <ArtworkFallback
            kind="band"
            label={band.name}
            className="h-14 w-14 shrink-0 rounded-md"
          />
        )}

        <div className="min-w-0">
          <h3 className="metal-title truncate text-base">{band.name}</h3>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
            {/* Code pays ISO affiché tel quel (pas d'emoji : cohérence cross-plateforme) */}
            {band.countryCode && (
              <span className="border-border rounded border px-1 py-0.5 font-mono">
                {band.countryCode}
              </span>
            )}
            <span>{activityPeriod(band)}</span>
            {band.dissolvedYear && <span>(séparé)</span>}
          </p>
        </div>
      </div>

      {/* Bio tronquée si présente */}
      {band.bio && (
        <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
          {band.bio}
        </p>
      )}
    </Link>
  );
}
