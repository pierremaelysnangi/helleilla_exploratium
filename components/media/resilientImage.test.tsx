/**
 * Tests du rechargement automatique des images distantes.
 *
 * Le défaut corrigé ici est visible à l'œil : un visuel dont le
 * chargement échoue laisse un cadre vide avec son texte alternatif, et
 * rien, dans une page déjà rendue, ne retente jamais.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ResilientImage } from "./resilientImage";

// next/image exige la configuration du serveur ; on le réduit à un <img>
// qui conserve `src` et `onError`, seuls comportements exercés ici.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onError,
  }: {
    src: string;
    alt: string;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} />
  ),
}));

const SRC = "https://exemple.test/photo.jpg";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

/** Provoque un échec de chargement puis laisse filer le temps. */
async function failThenWait(ms: number) {
  fireEvent.error(screen.getByRole("img"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("ResilientImage", () => {
  it("retente après un échec, en changeant la clé de cache", async () => {
    render(<ResilientImage src={SRC} alt="Photo" />);
    expect(screen.getByRole("img").getAttribute("src")).toBe(SRC);

    await failThenWait(500);

    // Le paramètre est indispensable : sans lui l'optimiseur resservirait
    // l'échec qu'il vient de mémoriser.
    expect(screen.getByRole("img").getAttribute("src")).toBe(`${SRC}?retry=1`);
  });

  it("espace les réessais au lieu de marteler la source", async () => {
    render(<ResilientImage src={SRC} alt="Photo" />);

    await failThenWait(500);
    const afterFirst = screen.getByRole("img").getAttribute("src");

    // Deuxième échec : l'attente a doublé, 500 ms ne suffisent plus
    fireEvent.error(screen.getByRole("img"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByRole("img").getAttribute("src")).toBe(afterFirst);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByRole("img").getAttribute("src")).toBe(`${SRC}?retry=2`);
  });

  it("préserve les paramètres déjà présents dans l'URL", async () => {
    // Les URLs de Wikimedia Commons portent déjà `?width=800`.
    render(<ResilientImage src={`${SRC}?width=800`} alt="Photo" />);

    await failThenWait(500);

    expect(screen.getByRole("img").getAttribute("src")).toBe(
      `${SRC}?width=800&retry=1`,
    );
  });

  it("prévient l'appelant une fois les réessais épuisés", async () => {
    const onExhausted = vi.fn();
    render(<ResilientImage src={SRC} alt="Photo" onExhausted={onExhausted} />);

    // Six réessais, chacun suivi d'un nouvel échec
    for (let i = 0; i < 7; i++) {
      fireEvent.error(screen.getByRole("img"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
    }

    expect(onExhausted).toHaveBeenCalled();
  });

  it("n'abandonne pas dès le premier échec", async () => {
    // Régression : le repli basculait immédiatement sur un autre visuel,
    // alors qu'une indisponibilité passagère se résout souvent seule.
    const onExhausted = vi.fn();
    render(<ResilientImage src={SRC} alt="Photo" onExhausted={onExhausted} />);

    await failThenWait(500);

    expect(onExhausted).not.toHaveBeenCalled();
  });
});
