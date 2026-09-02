/**
 * Store du lecteur audio global.
 *
 * Raison d'être : garantir qu'UNE SEULE piste joue à la fois dans toute
 * l'application. Avec un `<audio>` par ligne de tracklist, ouvrir deux
 * panneaux superposait deux lectures ; ici l'élément audio est unique
 * (monté par `<MiniPlayer>`) et cet état décrit ce qu'il doit jouer.
 *
 * Le store ne détient donc pas l'élément : il décrit une intention
 * (« joue cette piste »), que `usePlayerAudio` applique à l'élément réel.
 */

import { create } from "zustand";

/** Piste jouable : un extrait officiel ou un fichier hébergé. */
export type PlayableTrack = {
  /** Identifiant stable (id de piste, ou URL pour un extrait externe). */
  id: string;
  title: string;
  /** Nom du groupe, affiché sous le titre. */
  artist: string;
  /** URL du média (extrait Deezer 30 s ou fichier MinIO). */
  src: string;
  /** Provenance, affichée pour ne jamais masquer la source réelle. */
  source: "deezer" | "hosted";
};

type AudioPlayerState = {
  /** Piste courante, ou null si le lecteur est au repos. */
  current: PlayableTrack | null;
  /** File d'attente : les pistes suivantes de la même tracklist. */
  queue: PlayableTrack[];
  /** Intention de lecture ; l'élément audio peut mettre un instant à suivre. */
  isPlaying: boolean;
  /** Position courante en secondes, alimentée par l'élément audio. */
  currentTime: number;
  /** Durée totale, connue seulement après chargement des métadonnées. */
  duration: number;

  /** Démarre une piste, en remplaçant éventuellement la file. */
  play: (track: PlayableTrack, queue?: PlayableTrack[]) => void;
  /** Bascule lecture/pause sur la piste courante. */
  toggle: () => void;
  pause: () => void;
  /** Passe à la piste suivante ; arrête le lecteur si la file est vide. */
  next: () => void;
  /** Arrête et vide le lecteur. */
  stop: () => void;
  /** Reporte la progression depuis l'élément audio. */
  setProgress: (currentTime: number, duration: number) => void;
  /** Demande un déplacement ; consommé puis remis à null par le hook. */
  seekTo: number | null;
  seek: (seconds: number) => void;
  clearSeek: () => void;
};

export const useAudioPlayerStore = create<AudioPlayerState>()((set, get) => ({
  current: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  seekTo: null,

  play: (track, queue = []) =>
    set({
      current: track,
      queue,
      isPlaying: true,
      // Repartir de zéro : relancer une piste ne doit pas reprendre la
      // position de la précédente.
      currentTime: 0,
      duration: 0,
      seekTo: null,
    }),

  toggle: () => {
    if (!get().current) return;
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  pause: () => set({ isPlaying: false }),

  next: () => {
    const [head, ...rest] = get().queue;
    if (!head) {
      set({ isPlaying: false, currentTime: 0 });
      return;
    }
    set({
      current: head,
      queue: rest,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      seekTo: null,
    });
  },

  stop: () =>
    set({
      current: null,
      queue: [],
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      seekTo: null,
    }),

  setProgress: (currentTime, duration) =>
    set({
      currentTime,
      // Une durée non finie (flux, métadonnées absentes) est ignorée
      duration: Number.isFinite(duration) ? duration : 0,
    }),

  seek: (seconds) => set({ seekTo: Math.max(0, seconds) }),
  clearSeek: () => set({ seekTo: null }),
}));
