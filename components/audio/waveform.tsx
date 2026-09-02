"use client";

/**
 * <Waveform> — forme d'onde RÉELLE d'une piste, cliquable pour se déplacer.
 *
 * Les amplitudes sont calculées en décodant le fichier audio (Web Audio
 * API), jamais générées. Une forme d'onde décorative tirée au hasard
 * serait une donnée inventée : ce projet interdit précisément d'afficher
 * ce qui ne provient pas d'une source réelle.
 *
 * Quand le décodage est impossible — CORS absent sur le CDN, format non
 * décodable, `AudioContext` indisponible — le composant ne rend rien et
 * laisse l'appelant afficher une simple barre de progression. C'est le
 * cas le plus fréquent sur les extraits externes, et c'est assumé.
 */

import { useEffect, useRef, useState } from "react";

/** Nombre de barres affichées : lisible sans être coûteux à calculer. */
const BAR_COUNT = 64;

type WaveformProps = {
  /** URL du média à analyser. */
  src: string;
  /** Progression courante, entre 0 et 1, pour colorer les barres jouées. */
  progress: number;
  /** Déplacement demandé, en fraction de la durée. */
  onSeek: (fraction: number) => void;
};

/**
 * Réduit un buffer décodé à `BAR_COUNT` amplitudes moyennes.
 *
 * On moyenne la valeur absolue sur chaque tranche plutôt que d'échantillonner
 * un point : un simple échantillonnage manquerait les transitoires et
 * donnerait une silhouette trompeuse.
 */
function computePeaks(buffer: AudioBuffer): number[] {
  const channel = buffer.getChannelData(0);
  const blockSize = Math.floor(channel.length / BAR_COUNT) || 1;
  const peaks: number[] = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channel[start + j] ?? 0);
    }
    peaks.push(sum / blockSize);
  }

  // Normalisation sur le pic réel : sans elle, un extrait peu fort
  // apparaîtrait comme une ligne plate.
  const max = Math.max(...peaks);
  return max > 0 ? peaks.map((p) => p / max) : peaks;
}

export function Waveform({ src, progress, onSeek }: WaveformProps) {
  // L'analyse porte sa source : comparer au `src` courant suffit à
  // invalider un résultat obsolète, sans remettre l'état à zéro depuis
  // l'effet (ce qui provoquerait un rendu en cascade).
  const [analysis, setAnalysis] = useState<{
    src: string;
    peaks: number[];
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const peaks = analysis?.src === src ? analysis.peaks : null;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function analyse() {
      try {
        const AudioContextCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextCtor) return;

        const res = await fetch(src, { signal: controller.signal });
        if (!res.ok) return;
        const bytes = await res.arrayBuffer();

        const context = new AudioContextCtor();
        try {
          const buffer = await context.decodeAudioData(bytes);
          if (!cancelled) setAnalysis({ src, peaks: computePeaks(buffer) });
        } finally {
          // Un AudioContext non fermé reste comptabilisé par le navigateur
          void context.close();
        }
      } catch {
        // Décodage impossible : l'appelant affichera une barre simple.
        // Silencieux à dessein — c'est un cas nominal, pas une panne.
      }
    }

    void analyse();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [src]);

  if (!peaks) return null;

  /** Convertit un clic en fraction de la durée. */
  function handleSeek(event: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onSeek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
  }

  const playedBars = Math.round(progress * BAR_COUNT);

  return (
    <div
      ref={containerRef}
      onClick={handleSeek}
      role="presentation"
      className="flex h-10 w-full cursor-pointer items-center gap-px"
      // La barre de progression accessible est fournie par <AudioPlayer> :
      // ce rendu est une aide visuelle, pas le contrôle principal.
      aria-hidden
    >
      {peaks.map((peak, index) => (
        <span
          key={index}
          style={{ height: `${Math.max(6, peak * 100)}%` }}
          className={
            index < playedBars
              ? "bg-primary w-full rounded-sm"
              : "bg-muted-foreground/30 w-full rounded-sm"
          }
        />
      ))}
    </div>
  );
}
