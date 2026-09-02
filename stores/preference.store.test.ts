/**
 * Tests du store des préférences.
 *
 * Le point sensible est le bornage du volume : une valeur hors [0, 1]
 * levée par `HTMLMediaElement.volume` casserait la lecture.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { usePreferenceStore, DEFAULT_VOLUME } from "./preference.store";

const state = () => usePreferenceStore.getState();

beforeEach(() => {
  usePreferenceStore.setState({ volume: DEFAULT_VOLUME, muted: false });
});

describe("setVolume", () => {
  it("accepte une valeur dans l'intervalle", () => {
    state().setVolume(0.42);
    expect(state().volume).toBeCloseTo(0.42);
  });

  it.each([
    [-1, 0],
    [2, 1],
  ])("borne %s à %s", (input, expected) => {
    state().setVolume(input);
    expect(state().volume).toBe(expected);
  });

  it("retombe sur la valeur par défaut pour NaN", () => {
    state().setVolume(Number.NaN);
    expect(state().volume).toBe(DEFAULT_VOLUME);
  });

  it("lève la sourdine : régler le volume exprime l'intention d'entendre", () => {
    usePreferenceStore.setState({ muted: true });
    state().setVolume(0.5);
    expect(state().muted).toBe(false);
  });
});

describe("toggleMuted", () => {
  it("bascule sans altérer le volume mémorisé", () => {
    state().setVolume(0.3);
    state().toggleMuted();

    expect(state().muted).toBe(true);
    // Le volume est conservé pour être restauré au rétablissement du son
    expect(state().volume).toBeCloseTo(0.3);
  });
});
