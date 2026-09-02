"use client";

/**
 * <MiniPlayer> — barre de lecture persistante, montée une seule fois dans
 * le layout racine.
 *
 * C'est le SEUL composant à posséder un élément `<audio>` : la lecture
 * survit donc à la navigation, et deux extraits ne peuvent pas se
 * superposer. Il ne rend rien tant qu'aucune piste n'est chargée.
 */

import { useAudioPlayerStore } from "@/stores/audioPlayer.store";
import { usePlayerAudio } from "@/hooks/use-player-audio";
import { AudioPlayer } from "./audioPlayer";

export function MiniPlayer() {
  const current = useAudioPlayerStore((s) => s.current);
  const { audioRef, handlers } = usePlayerAudio();

  if (!current) return null;

  return (
    <div
      role="region"
      aria-label="Lecteur audio"
      className="border-border bg-card/95 sticky bottom-0 z-40 border-t backdrop-blur"
    >
      <div className="site-container py-3">
        <AudioPlayer />
      </div>

      {/* Élément unique de l'application : `key` force son remplacement à
          chaque changement de piste, ce qui évite qu'un navigateur
          conserve le buffer de la précédente. */}
      <audio
        key={current.id}
        ref={audioRef}
        src={current.src}
        preload="metadata"
        crossOrigin="anonymous"
        onTimeUpdate={handlers.onTimeUpdate}
        onLoadedMetadata={handlers.onLoadedMetadata}
        onEnded={handlers.onEnded}
        onError={handlers.onError}
        className="hidden"
      />
    </div>
  );
}
