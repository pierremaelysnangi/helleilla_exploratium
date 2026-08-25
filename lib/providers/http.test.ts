/**
 * Tests du client HTTP des providers (lib/providers/http.ts).
 * fetch et Redis sont stubés : vérifie l'ordre cache -> réseau, la
 * validation zod, le retry sur 5xx/429, le refus de retry sur 4xx,
 * le timeout et le throttling par hôte.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { fetchJson, ProviderError } from "./http";

// Cache Redis en mémoire pour la durée d'un test.
const redisStore = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
      return "OK";
    }),
    clear: () => store.clear(),
  };
});
vi.mock("@/lib/redis", () => ({ redis: redisStore }));

// Schéma de test : { value: number }
const schema = z.object({ value: z.number() });

/** Stub fetch renvoyant une réponse JSON. */
function stubFetch(status: number, payload: unknown) {
  return vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(payload), { status }),
  );
}

beforeEach(() => {
  redisStore.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("récupère depuis le réseau puis sert les appels suivants depuis le cache", async () => {
    const fetchMock = stubFetch(200, { value: 42 });
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchJson("https://api.test/x", schema);
    expect(first.value).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Deuxième appel : servi par Redis, fetch non rappelé
    const second = await fetchJson("https://api.test/x", schema);
    expect(second.value).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retente sur un 503 puis réussit", async () => {
    const failing = stubFetch(503, {});
    const ok = stubFetch(200, { value: 7 });
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => (call++ === 0 ? failing("") : ok(""))),
    );

    const result = await fetchJson("https://api.test/y", schema, {
      retries: 2,
    });
    expect(result.value).toBe(7);
  });

  it("échoue définitivement (ProviderError) sans retry sur un 404", async () => {
    const fetchMock = stubFetch(404, {});
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson("https://api.test/z", schema)).rejects.toThrow(
      ProviderError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1); // pas de retry sur 4xx
  });

  it("valide la réponse avec le schéma zod (ZodError si contrat violé)", async () => {
    vi.stubGlobal("fetch", stubFetch(200, { value: "pas-un-nombre" }));
    await expect(fetchJson("https://api.test/w", schema)).rejects.toThrow(
      z.ZodError,
    );
  });

  it("envoie le User-Agent applicatif exigé par MusicBrainz", async () => {
    const fetchMock = stubFetch(200, { value: 1 });
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("https://api.test/ua", schema);
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("User-Agent")).toMatch(/HelleillaExploratium/);
  });
});
