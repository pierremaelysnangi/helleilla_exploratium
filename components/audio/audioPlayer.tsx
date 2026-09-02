"use client";

/**
 * <AudioPlayer> — contrôles de lecture de la piste courante.
 *
 * Composant de présentation : il ne possède ni l'élément `<audio>` ni
 * l'état, il agit sur le store. C'est ce qui permet de l'afficher à
 * plusieurs endroits sans jamais dupliquer une lecture.
 */

import { useAudioPlayerStore } from "@/stores/audioPlayer.store";
import { usePreferenceStore } from "@/stores/preference.store";
import { Waveform } from "./waveform";

/** Formate des secondes en m:ss ; tiret si la durée est inconnue. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Libellé de provenance : la source d'un média n'est jamais masquée. */
const SOURCE_LABELS = {
  deezer: "Extrait 30 s — Deezer",
  hosted: "Fichier hébergé",
} as const;

export function AudioPlayer() {
  const current = useAudioPlayerStore((s) => s.current);
  const isPlaying = useAudioPlayerStore((s) => s.isPlaying);
  const currentTime = useAudioPlayerStore((s) => s.currentTime);
  const duration = useAudioPlayerStore((s) => s.duration);
  const queue = useAudioPlayerStore((s) => s.queue);
  const toggle = useAudioPlayerStore((s) => s.toggle);
  const next = useAudioPlayerStore((s) => s.next);
  const stop = useAudioPlayerStore((s) => s.stop);
  const seek = useAudioPlayerStore((s) => s.seek);

  const volume = usePreferenceStore((s) => s.volume);
  const muted = usePreferenceStore((s) => s.muted);
  const setVolume = usePreferenceStore((s) => s.setVolume);
  const toggleMuted = usePreferenceStore((s) => s.toggleMuted);

  if (!current) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? "Mettre en pause" : "Reprendre la lecture"}
          className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{current.title}</p>
          <p className="text-muted-foreground truncate text-xs">
            {current.artist} · {SOURCE_LABELS[current.source]}
          </p>
        </div>

        {queue.length > 0 && (
          <button
            type="button"
            onClick={next}
            aria-label="Piste suivante"
            className="border-border hover:bg-accent/30 rounded-md border px-2 py-1 text-xs"
          >
            ▶▶
          </button>
        )}

        <button
          type="button"
          onClick={toggleMuted}
          aria-label={muted ? "Rétablir le son" : "Couper le son"}
          className="border-border hover:bg-accent/30 rounded-md border px-2 py-1 text-xs"
        >
          {muted ? "🔇" : "🔊"}
        </button>

        <label className="hidden items-center gap-2 sm:flex">
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20"
          />
        </label>

        <button
          type="button"
          onClick={stop}
          aria-label="Fermer le lecteur"
          className="text-muted-foreground hover:text-foreground px-1 text-sm"
        >
          ✕
        </button>
      </div>

      {/* Forme d'onde réelle si le fichier a pu être décodé ; sinon rien,
          la barre de progression ci-dessous reste le contrôle de référence. */}
      <Waveform
        src={current.src}
        progress={progress}
        onSeek={(fraction) => seek(fraction * duration)}
      />

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-10 shrink-0 text-right font-mono text-xs">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          disabled={duration === 0}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Position de lecture"
          className="min-w-0 flex-1"
        />
        <span className="text-muted-foreground w-10 shrink-0 font-mono text-xs">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
