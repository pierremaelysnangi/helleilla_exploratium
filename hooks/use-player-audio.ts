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

/** Fraction du volume cible au tout début du fondu d'entrée. */
const FADE_START_RATIO = 0.15;
/** Durée du fondu d'entrée, en millisecondes. */
const FADE_DURATION_MS = 900;

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

  /** Identifiant de l'animation de fondu en cours, pour l'interrompre. */
  const fadeRef = useRef<number | null>(null);

  // Applique l'intention lecture/pause.
  //
  // `play()` rejette dans deux cas très différents, qu'il fallait cesser
  // de confondre :
  //
  // - `AbortError` / `NotAllowedError` déclenchés parce qu'un nouveau
  //   chargement a interrompu le précédent. C'était le défaut principal :
  //   enchaîner deux pistes rejetait la première promesse, le `catch`
  //   repassait le store en pause, et la lecture s'arrêtait sans raison
  //   visible — « le lecteur ne marche pas pour certains sons » ;
  // - une vraie source illisible, qui doit bien repasser en pause.
  //
  // On ne met donc en pause que si l'élément concerné est TOUJOURS celui
  // que le store veut jouer au moment du rejet.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;

    if (!isPlaying) {
      el.pause();
      return;
    }

    const wanted = current.id;
    void el.play().catch((error: unknown) => {
      const aborted =
        error instanceof DOMException && error.name === "AbortError";
      const stale = useAudioPlayerStore.getState().current?.id !== wanted;
      if (aborted || stale) return;
      pause();
    });
  }, [current, isPlaying, pause]);

  // Volume et sourdine suivent les préférences persistées.
  //
  // Le fondu d'entrée est géré séparément : pendant qu'il court,
  // `el.volume` monte progressivement et ne doit pas être écrasé.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (fadeRef.current === null) el.volume = volume;
  }, [volume, muted]);

  // Fondu d'entrée à chaque changement de piste.
  //
  // Deux raisons, toutes deux constatées à l'usage : un extrait qui
  // démarre à plein volume sur un morceau de metal fait sursauter, et
  // les extraits n'ont pas tous le même niveau de mastering — passer de
  // l'un à l'autre produisait des écarts brutaux. Le fondu part de 15 %
  // du volume choisi et rejoint ce volume en un peu moins d'une seconde.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;

    const target = volume;
    const start = performance.now();
    el.volume = target * FADE_START_RATIO;

    const step = (now: number) => {
      const node = audioRef.current;
      if (!node) return;

      const ratio = Math.min(1, (now - start) / FADE_DURATION_MS);
      node.volume =
        target * (FADE_START_RATIO + (1 - FADE_START_RATIO) * ratio);

      if (ratio < 1) {
        fadeRef.current = requestAnimationFrame(step);
      } else {
        fadeRef.current = null;
      }
    };
    fadeRef.current = requestAnimationFrame(step);

    return () => {
      if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
      fadeRef.current = null;
    };
    // `volume` volontairement absent : régler le volume pendant la
    // lecture ne doit pas relancer un fondu depuis le silence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

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
