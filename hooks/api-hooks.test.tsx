/**
 * Tests des hooks d'entité (use-bands) et de la recherche (use-search).
 * fetch est stubé ; on vérifie : la requête de liste (URL + validation),
 * la mutation create avec corps normalisé, et le debounce de
 * useGlobalSearch (une seule requête après stabilisation du terme).
 */
// Environnement DOM requis par renderHook
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
// Provider + client TanStack Query isolés par test
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
// Hooks testés
import { useBands, useCreateBand } from "./use-bands";
import { useGlobalSearch } from "./use-search";
import { useBandMedia } from "./use-band-media";

/** UUID valide (RFC 9562 v4) réutilisable dans les fixtures. */
const UUID = "7b5e4850-93fd-48f0-bb37-cd67219015a1";
/** Second UUID valide pour les fixtures liées (album -> band). */
const UUID2 = "0d7f6a10-1e2e-4c3a-9b8d-52a1f0e3d4c5";

/** Fixture d'une ligne band sérialisée conforme à bandRowSchema. */
const BAND_ROW = {
  id: UUID,
  name: "Emperor",
  slug: "emperor",
  bio: null,
  countryCode: "NO",
  formedYear: 1991,
  dissolvedYear: null,
  imageUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** Stub global de fetch renvoyant une réponse JSON donnée. */
function stubFetch(payload: unknown, status = 200) {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/**
 * Enveloppe les hooks dans un provider TanStack Query frais
 * (retry désactivé pour des tests rapides et déterministes).
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Restauration de fetch natif et des timers réels après chaque test.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useBands", () => {
  it("récupère et valide une page de groupes", async () => {
    const fetchMock = stubFetch({
      data: [BAND_ROW],
      meta: { total: 1, page: 2, perPage: 20, totalPages: 1 },
    });

    const { result } = renderHook(() => useBands({ page: 2 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].name).toBe("Emperor");
    expect(result.current.data?.meta.total).toBe(1);

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/api/bands");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("expose une erreur si la réponse viole le schéma de ligne", async () => {
    stubFetch({ data: [{ id: "pas-un-uuid" }], meta: {} });

    const { result } = renderHook(() => useBands(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // La ligne invalide n'est jamais rendue : l'erreur est exposée telle quelle
    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateBand", () => {
  it("POSTe le corps validé vers /api/bands", async () => {
    const fetchMock = stubFetch({ data: BAND_ROW }, 201);

    const { result } = renderHook(() => useCreateBand(), {
      wrapper: createWrapper(),
    });

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.mutateAsync({ name: "Mayhem", slug: "mayhem" });
    });
    await expect(promise!).resolves.toBeDefined();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0];
    expect((url as URL).pathname).toBe("/api/bands");
    expect(init?.method).toBe("POST");
    // Le corps a été normalisé par createBandSchema avant envoi
    expect(JSON.parse(String(init?.body)).name).toBe("Mayhem");
  });

  it("échoue sans appeler l'API si le corps est invalide", async () => {
    const fetchMock = stubFetch({ data: BAND_ROW }, 201);

    const { result } = renderHook(() => useCreateBand(), {
      wrapper: createWrapper(),
    });

    act(() => {
      // slug invalide : ne respecte pas le kebab-case exigé par le schéma
      result.current
        .mutateAsync({ name: "Mayhem", slug: "Slug Invalide!" })
        .catch(() => undefined);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useGlobalSearch", () => {
  it("ne requête qu'après stabilisation du terme (debounce)", async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch({
      data: { bands: [], albums: [], tracks: [] },
    });

    const { rerender } = renderHook(
      ({ q }) => useGlobalSearch({ q, debounceMs: 300 }),
      { initialProps: { q: "" }, wrapper: createWrapper() },
    );

    // Série de frappes rapprochées : chaque frappe relance le timer
    rerender({ q: "emp" });
    rerender({ q: "empe" });
    rerender({ q: "emper" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    // Avant échéance du debounce : aucune requête partie
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    // Une seule requête, avec la dernière valeur stable
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/api/search");
    expect(url.searchParams.get("q")).toBe("emper");
  });

  it("valide la réponse groupée avant exposition", async () => {
    stubFetch({
      data: {
        bands: [
          {
            id: UUID,
            name: "Emperor",
            slug: "emperor",
            bio: null,
            countryCode: "NO",
            formedYear: 1991,
          },
        ],
        albums: [
          {
            id: UUID2,
            title: "Anthems to the Welkin at Dusk",
            slug: "anthems",
            bandId: UUID,
            type: "album",
            releaseDate: null,
          },
        ],
        tracks: [],
      },
    });

    const { result } = renderHook(() => useGlobalSearch({ q: "emp" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.bands).toHaveLength(1);
    expect(result.current.data?.albums[0].type).toBe("album");
    expect(result.current.data?.tracks).toEqual([]);
  });

  it("reste inactif pour un terme vide", async () => {
    const fetchMock = stubFetch({
      data: { bands: [], albums: [], tracks: [] },
    });

    const { result } = renderHook(() => useGlobalSearch({ q: "   " }), {
      wrapper: createWrapper(),
    });

    // Laisse le temps à une éventuelle requête de partir
    await act(async () => {});
    // enabled=false : ni chargement ni erreur, pas de fetch déclenché
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useBandMedia", () => {
  /** DTO média minimal conforme à bandMediaSchema. */
  const MEDIA_DTO = {
    band: {
      id: UUID,
      name: "Emperor",
      slug: "emperor",
      countryCode: "NO",
      formedYear: 1991,
      dissolvedYear: null,
      bio: null,
      imageUrl: null,
    },
    info: {
      area: "Norway",
      lifeSpan: { begin: "1991", end: null, ended: false },
      members: [{ id: "mb-1", name: "Ihsahn" }],
      genres: ["black metal"],
      wikidata: null,
    },
    images: [],
    links: [],
    previews: [],
    degraded: false,
  };

  it("déballe l'enveloppe { data } avant de valider le DTO", async () => {
    // Régression : le hook validait la réponse ENTIÈRE avec le schéma du
    // DTO. Comme la route répond `{ data: dto }`, le parse échouait
    // systématiquement et la section média était toujours en erreur.
    stubFetch({ data: MEDIA_DTO });

    const { result } = renderHook(() => useBandMedia(UUID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.band.name).toBe("Emperor");
    expect(result.current.data?.info.members).toEqual([
      { id: "mb-1", name: "Ihsahn" },
    ]);
  });

  it("reste inactif tant qu'aucun identifiant n'est fourni", async () => {
    const fetchMock = stubFetch({ data: MEDIA_DTO });

    const { result } = renderHook(() => useBandMedia(null), {
      wrapper: createWrapper(),
    });

    await act(async () => {});
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
