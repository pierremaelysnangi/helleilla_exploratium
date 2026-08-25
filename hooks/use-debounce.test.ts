/**
 * Tests du hook useDebounce (hooks/use-debounce.ts).
 * Vérifie la propagation retardée, l'annulation en cas de changement
 * rapide et le délai personnalisé, avec des timers simulés.
 */
// Environnement DOM requis par renderHook (React DOM)
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "@testing-library/react";
// Rendu de hooks hors composant
import { renderHook } from "@testing-library/react";
import { useDebounce } from "./use-debounce";

// Restauration des timers réels après chaque test.
afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("renvoie la valeur initiale immédiatement", () => {
    const { result } = renderHook(() => useDebounce("initial"));
    expect(result.current).toBe("initial");
  });

  it("propage la nouvelle valeur après le délai par défaut (300 ms)", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    expect(result.current).toBe("a"); // pas encore propagé

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("ab");
  });

  it("annule la propagation si la valeur change avant échéance", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });

    // Série de frappes rapprochées
    rerender({ value: "ab" });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "abc" });
    await act(async () => {
      vi.advanceTimersByTime(200); // 400 ms cumulés mais timer relancé
    });

    // La valeur intermédiaire "ab" n'a jamais été propagée
    expect(result.current).toBe("a");

    await act(async () => {
      vi.advanceTimersByTime(100); // 300 ms depuis la dernière frappe
    });
    // Seule la dernière valeur stable est propagée
    expect(result.current).toBe("abc");
  });

  it("respecte un délai personnalisé", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 50),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe(2);
  });
});
