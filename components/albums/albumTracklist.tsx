"use client";

/**
 * <AlbumTracklist> — liste des pistes d'un album avec menu déroulant
 * d'écoute par piste.
 *
 * Design validé : chaque ligne de piste porte un chevron `>` ouvrant un
 * panneau listant les plateformes officielles (Deezer, Spotify,
 * Bandcamp, YouTube) et les sites de paroles (Metal Archives, Genius).
 * Un extrait Deezer 30 s est jouable inline si un preview correspond au
 * titre (données du resolver média) ; sinon les liens mènent à la
 * recherche officielle de la plateforme. Aucune parole n'est reproduite
 * dans l'application : seulement référencée.
 */

// État local : quelle piste a son panneau ouvert
import { useState } from "react";
// Lecteur global : une seule piste joue à la fois dans toute l'application
import {
  useAudioPlayerStore,
  type PlayableTrack,
} from "@/stores/audioPlayer.store";
// Types validés côté client
import type { TrackRow } from "@/hooks/api/schemas";
// Liens officiels par plateforme
import { trackSearchLinks, trackLyricsLinks } from "@/lib/media/platformLinks";
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
  const play = useAudioPlayerStore((s) => s.play);
  const currentId = useAudioPlayerStore((s) => s.current?.id ?? null);

  /**
   * Construit la file de lecture à partir des pistes qui disposent
   * réellement d'un média : l'extrait Deezer correspondant, ou le fichier
   * hébergé. Les autres sont simplement absentes de la file.
   */
  function buildQueue(fromIndex: number): PlayableTrack[] {
    return tracks
      .slice(fromIndex + 1)
      .map((t) => {
        const src = findPreview(previews, t.title)?.previewUrl ?? t.audioUrl;
        if (!src) return null;
        return {
          id: t.id,
          title: t.title,
          artist: artistName,
          src,
          source: (findPreview(previews, t.title)
            ? "deezer"
            : "hosted") as PlayableTrack["source"],
        };
      })
      .filter((t): t is PlayableTrack => t !== null);
  }

  return (
    <ol className="divide-border border-border divide-y rounded-lg border">
      {tracks.map((track, index) => {
        const isOpen = openIndex === index;
        const links = trackSearchLinks(artistName, track.title);
        const lyrics = trackLyricsLinks(artistName, track.title);
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
                {/* Lecture déléguée au lecteur global : un <audio> par
                    ligne permettait deux lectures simultanées. */}
                {(preview || track.audioUrl) && (
                  <div className="mb-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        play(
                          {
                            id: track.id,
                            title: track.title,
                            artist: artistName,
                            src: preview?.previewUrl ?? track.audioUrl!,
                            source: preview ? "deezer" : "hosted",
                          },
                          buildQueue(index),
                        )
                      }
                      className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide uppercase hover:opacity-90"
                    >
                      {currentId === track.id ? "En lecture" : "Écouter"}
                    </button>
                    <span className="text-muted-foreground text-xs">
                      {preview ? "Extrait 30 s — Deezer" : "Fichier hébergé"}
                    </span>
                  </div>
                )}
                {/* Liens d'écoute officiels */}
                <p className="text-muted-foreground mb-1.5 text-[11px] tracking-wide uppercase">
                  Écouter
                </p>
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

                {/* Paroles : jamais reproduites ici, seulement référencées */}
                <p className="text-muted-foreground mt-3 mb-1.5 text-[11px] tracking-wide uppercase">
                  Paroles
                </p>
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(lyrics).map(([source, link]) => (
                    <li key={source}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-border hover:border-primary/50 rounded-md border px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors"
                      >
                        {link.label} ↗
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
