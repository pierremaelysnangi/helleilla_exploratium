/**
 * Tests du store du lecteur audio.
 *
 * L'invariant que ce store existe pour garantir : une seule piste jouable
 * à la fois. Les tests portent donc sur les transitions d'état, pas sur le
 * rendu — c'est là que se joue la correction du lecteur.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAudioPlayerStore, type PlayableTrack } from "./audioPlayer.store";

/** Fabrique une piste jouable. */
function track(id: string): PlayableTrack {
  return {
    id,
    title: `Piste ${id}`,
    artist: "Necrofrost",
    src: `https://exemple.test/${id}.mp3`,
    source: "deezer",
  };
}

/** Raccourci de lecture de l'état courant. */
const state = () => useAudioPlayerStore.getState();

beforeEach(() => {
  state().stop();
});

describe("play", () => {
  it("charge la piste et démarre la lecture", () => {
    state().play(track("a"));

    expect(state().current?.id).toBe("a");
    expect(state().isPlaying).toBe(true);
  });

  it("repart de zéro en changeant de piste", () => {
    state().play(track("a"));
    state().setProgress(12, 30);
    state().play(track("b"));

    // Sans cette remise à zéro, la nouvelle piste hériterait de la
    // position de la précédente.
    expect(state().currentTime).toBe(0);
    expect(state().duration).toBe(0);
  });

  it("remplace la file d'attente", () => {
    state().play(track("a"), [track("b"), track("c")]);
    expect(state().queue).toHaveLength(2);

    state().play(track("d"));
    expect(state().queue).toEqual([]);
  });
});

describe("toggle / pause", () => {
  it("bascule lecture et pause", () => {
    state().play(track("a"));
    state().toggle();
    expect(state().isPlaying).toBe(false);
    state().toggle();
    expect(state().isPlaying).toBe(true);
  });

  it("ne fait rien sans piste chargée", () => {
    state().toggle();
    expect(state().isPlaying).toBe(false);
    expect(state().current).toBeNull();
  });
});

describe("next", () => {
  it("passe à la piste suivante et raccourcit la file", () => {
    state().play(track("a"), [track("b"), track("c")]);

    state().next();

    expect(state().current?.id).toBe("b");
    expect(state().queue.map((t) => t.id)).toEqual(["c"]);
    expect(state().isPlaying).toBe(true);
  });

  it("s'arrête en fin de file sans vider la piste courante", () => {
    state().play(track("a"));

    state().next();

    // La piste reste affichée : l'utilisateur peut la relancer.
    expect(state().current?.id).toBe("a");
    expect(state().isPlaying).toBe(false);
  });
});

describe("progression et déplacement", () => {
  it("ignore une durée non finie", () => {
    state().play(track("a"));
    state().setProgress(5, Number.POSITIVE_INFINITY);

    // Un flux sans durée connue ne doit pas produire une barre absurde
    expect(state().duration).toBe(0);
    expect(state().currentTime).toBe(5);
  });

  it("mémorise puis acquitte un déplacement", () => {
    state().play(track("a"));
    state().seek(10);
    expect(state().seekTo).toBe(10);

    state().clearSeek();
    expect(state().seekTo).toBeNull();
  });

  it("refuse une position négative", () => {
    state().seek(-5);
    expect(state().seekTo).toBe(0);
  });
});

describe("stop", () => {
  it("vide entièrement le lecteur", () => {
    state().play(track("a"), [track("b")]);
    state().setProgress(10, 30);

    state().stop();

    expect(state().current).toBeNull();
    expect(state().queue).toEqual([]);
    expect(state().isPlaying).toBe(false);
    expect(state().currentTime).toBe(0);
  });
});
