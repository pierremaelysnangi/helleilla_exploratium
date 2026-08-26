"use client";

/**
 * <AlbumTracklist> — liste des pistes d'un album avec menu déroulant
 * d'écoute par piste.
 *
 * Design validé : chaque ligne de piste porte un chevron `>` ouvrant un
 * panneau listant les plateformes officielles (Deezer, Spotify, Qobuz,
 * Bandcamp, YouTube). Un extrait Deezer 30 s est jouable inline si un
 * preview correspond au titre (données du resolver média) ; sinon les
 * liens mènent à la recherche officielle de la plateforme.
 */

// État local : quelle piste a son panneau ouvert
import { useState } from "react";
// Types validés côté client
import type { TrackRow } from "@/hooks/api/schemas";
// Liens officiels par plateforme
import { trackSearchLinks } from "@/lib/media/platformLinks";
// Extrait Deezer optionnel associé à une piste
export type TrackPreview = {
  title: string;
  previewUrl: string;
};

type AlbumTracklistProps = {
  tracks: TrackRow[];
  /** Nom du groupe (construit les requêtes de recherche plateforme). */
  artistName: string;
  /** Extraits Deezer disponibles pour l'album (resolver média). */
  previews?: TrackPreview[];
};

/** Formate une durée en minutes:secondes. */
function formatDuration(ms?: number | null): string {
  if (!ms && ms !== 0) return "—";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Retrouve un extrait Deezer correspondant à la piste (titre normalisé).
 */
function findPreview(
  previews: TrackPreview[],
  title: string,
): TrackPreview | undefined {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return previews.find(
    (p) =>
      normalize(p.title).includes(normalize(title)) ||
      normalize(title).includes(normalize(p.title)),
  );
}

export function AlbumTracklist({
  tracks,
  artistName,
  previews = [],
}: AlbumTracklistProps) {
  // Une seule piste dépliée à la fois (index dans la liste)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ol className="divide-border border-border divide-y rounded-lg border">
      {tracks.map((track, index) => {
        const isOpen = openIndex === index;
        const links = trackSearchLinks(artistName, track.title);
        const preview = findPreview(previews, track.title);

        return (
          <li key={track.id} className="bg-card">
            {/* Ligne piste : numéro, titre, durée, chevron */}
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-muted-foreground w-6 text-right font-mono text-xs">
                {track.trackNumber}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {track.title}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {formatDuration(track.durationMs)}
              </span>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={`Options d'écoute pour ${track.title}`}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="border-border hover:border-primary/50 rounded-md border px-2 py-0.5 text-xs transition-colors"
              >
                {isOpen ? "▾" : "▸"}
              </button>
            </div>

            {/* Panneau plateformes (déplié) */}
            {isOpen && (
              <div className="border-border/60 bg-background/40 border-t px-4 py-3">
                {/* Extrait jouable inline si disponible */}
                {preview && (
                  <div className="mb-3 flex items-center gap-3">
                    <audio
                      controls
                      preload="none"
                      src={preview.previewUrl}
                      className="h-8 max-w-[260px]"
                    />
                    <span className="text-muted-foreground text-xs">
                      Extrait 30 s — Deezer
                    </span>
                  </div>
                )}
                {/* Liens d'écoute officiels */}
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(links).map(([platform, link]) => (
                    <li key={platform}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-border hover:border-primary/50 rounded-md border px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
