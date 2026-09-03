"use client";

/**
 * <AlbumTracklist> — liste des pistes d'un album, chaque ligne ouvrant
 * un panneau de liens.
 *
 * Le panneau ne dit qu'une chose : où écouter la piste. Ni extrait
 * intégré — sa diffusion, même depuis les serveurs de la plateforme,
 * exposait le projet à des signalements qu'une encyclopédie sans
 * revenus n'a pas les moyens de contester — ni lien vers les paroles,
 * qui encombraient la liste sans jamais tomber juste.
 */

import { useState } from "react";
import type { TrackRow } from "@/hooks/api/schemas";
import { trackSearchLinks } from "@/lib/media/platformLinks";
import { formatTrackDuration } from "@/lib/media/duration";
import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { externalLabel } from "@/lib/media/externalLabel";

type AlbumTracklistProps = {
  tracks: TrackRow[];
  /** Nom du groupe : construit les requêtes de recherche des plateformes. */
  artistName: string;
};

export function AlbumTracklist({ tracks, artistName }: AlbumTracklistProps) {
  const t = useT();
  // Une seule piste dépliée à la fois (index dans la liste)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ol className="divide-border border-border divide-y rounded-lg border">
      {tracks.map((track, index) => {
        const isOpen = openIndex === index;
        const listen = trackSearchLinks(artistName, track.title);

        return (
          <li key={track.id} className="bg-card">
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-muted-foreground w-6 shrink-0 text-right font-mono text-xs tabular-nums">
                {track.trackNumber}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {track.title}
              </span>
              <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                {formatTrackDuration(track.durationMs)}
              </span>
              {/* Carré fixe, contenu centré : le chevron était calé sur
                  la ligne de base du texte et sautait d'une ligne à
                  l'autre selon la hauteur du titre. */}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={interpolate(t.album.linksFor, {
                  track: track.title,
                })}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="border-border hover:border-primary/50 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs leading-none transition-colors"
              >
                <span aria-hidden>{isOpen ? "▾" : "▸"}</span>
              </button>
            </div>

            {isOpen && (
              <div className="border-border/60 bg-background/40 border-t px-4 py-3">
                <p className="text-muted-foreground mb-1.5 text-[11px] tracking-wide uppercase">
                  {t.album.listenAt}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(listen).map(([platform, link]) => (
                    <li key={platform}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-border hover:border-primary/50 rounded-md border px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors"
                      >
                        {externalLabel(link.label)}
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
