"use client";

/**
 * Hook `usePlayerAudio` — relie l'unique élément `<audio>` de
 * l'application au store `audioPlayer`.
 *
 * Le store décrit une intention (« joue cette piste, en pause ou non ») ;
 * ce hook la traduit en appels impératifs sur l'élément, et fait remonter
 * en retour la progression réelle. Cette séparation permet de garantir
 * qu'une seule piste joue à la fois, quel que soit le nombre de
 * composants qui déclenchent des lectures.
 *
 * Un seul composant doit l'appeler : `<MiniPlayer>`, monté dans le layout.
 */

import { useEffect, useRef } from "react";
import { useAudioPlayerStore } from "@/stores/audioPlayer.store";
import { usePreferenceStore } from "@/stores/preference.store";

export function usePlayerAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = useAudioPlayerStore((s) => s.current);
  const isPlaying = useAudioPlayerStore((s) => s.isPlaying);
  const seekTo = useAudioPlayerStore((s) => s.seekTo);
  const clearSeek = useAudioPlayerStore((s) => s.clearSeek);
  const setProgress = useAudioPlayerStore((s) => s.setProgress);
  const next = useAudioPlayerStore((s) => s.next);
  const pause = useAudioPlayerStore((s) => s.pause);

  const volume = usePreferenceStore((s) => s.volume);
  const muted = usePreferenceStore((s) => s.muted);

  // Applique l'intention lecture/pause. `play()` renvoie une promesse qui
  // rejette si le navigateur refuse (autoplay bloqué, source illisible) :
  // on repasse alors le store en pause pour ne pas afficher un état de
  // lecture mensonger.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;

    if (isPlaying) {
      void el.play().catch(() => pause());
    } else {
      el.pause();
    }
  }, [current, isPlaying, pause]);

  // Volume et sourdine suivent les préférences persistées
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted]);

  // Déplacement demandé par l'interface : appliqué puis acquitté
  useEffect(() => {
    const el = audioRef.current;
    if (!el || seekTo === null) return;
    el.currentTime = seekTo;
    clearSeek();
  }, [seekTo, clearSeek]);

  /** Handlers passés à l'élément <audio> par le composant lecteur. */
  const handlers = {
    onTimeUpdate: () => {
      const el = audioRef.current;
      if (el) setProgress(el.currentTime, el.duration);
    },
    onLoadedMetadata: () => {
      const el = audioRef.current;
      if (el) setProgress(el.currentTime, el.duration);
    },
    onEnded: () => next(),
    // Source injoignable (CSP, réseau, lien expiré) : on ne laisse pas
    // l'interface prétendre que la lecture continue.
    onError: () => pause(),
  };

  return { audioRef, handlers };
}
