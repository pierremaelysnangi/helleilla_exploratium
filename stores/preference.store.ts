/**
 * Store des préférences d'interface, persistées dans le navigateur.
 *
 * Périmètre volontairement étroit : le thème reste géré par `next-themes`
 * (qui gère déjà le rendu serveur et l'absence de flash), le dupliquer ici
 * créerait deux sources pour un même réglage. Ne vivent donc ici que les
 * réglages qu'aucune autre brique ne porte : volume et sourdine du
 * lecteur audio.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Volume par défaut : assez bas pour ne pas surprendre au premier extrait. */
export const DEFAULT_VOLUME = 0.7;

type PreferenceState = {
  /** Volume du lecteur, entre 0 et 1. */
  volume: number;
  /** Sourdine, indépendante du volume mémorisé. */
  muted: boolean;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;
};

/** Borne une valeur dans [0, 1]. */
function clampVolume(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, value));
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      volume: DEFAULT_VOLUME,
      muted: false,
      setVolume: (volume) => set({ volume: clampVolume(volume), muted: false }),
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
    }),
    {
      name: "helleilla:preferences",
      // Réglages de confort uniquement : rien ici ne doit être considéré
      // comme une donnée applicative, le stockage local n'est pas fiable.
      version: 1,
    },
  ),
);
