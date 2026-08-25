/**
 * Tests du client HTTP navigateur (hooks/api/client.ts).
 * fetch est remplacé par un stub : on vérifie la construction de l'URL
 * (query params), l'envoi JSON, le déballage de l'enveloppe `{ data }`
 * et la conversion des erreurs API en ApiClientError.
 */
// Environnement DOM : apiJson lit window.location.origin
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { apiJson, ApiClientError } from "./client";

/** Remplace fetch global par un stub renvoyant la réponse donnée. */
function stubFetch(status: number, payload: unknown) {
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

// Restauration de fetch natif après chaque test.
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiJson", () => {
  it("déballer l'enveloppe { data } et construit l'URL avec query params", async () => {
    const fetchMock = stubFetch(200, {
      data: [{ id: "x" }],
      meta: { total: 1 },
    });

    const data = await apiJson<{ id: string }[]>("/api/bands", {
      query: { page: 2, perPage: 20, q: undefined, empty: null },
    });

    expect(data).toEqual([{ id: "x" }]);
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/api/bands");
    // Valeurs null/undefined ignorées dans la query string
    expect(url.search).toBe("?page=2&perPage=20");
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
  });

  it("sérialise le corps JSON et positionne le Content-Type", async () => {
    const fetchMock = stubFetch(201, { data: { id: "new" } });

    await apiJson("/api/bands", { method: "POST", body: { name: "Mayhem" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "Mayhem" }));
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("lève ApiClientError avec code/message sur une erreur API", async () => {
    stubFetch(403, {
      error: { code: "FORBIDDEN", message: "Permission insuffisante" },
    });

    const promise = apiJson("/api/bands", { method: "POST", body: {} });
    await expect(promise).rejects.toMatchObject({
      name: "ApiClientError",
      status: 403,
      code: "FORBIDDEN",
      message: "Permission insuffisante",
    });
    await expect(promise).rejects.toBeInstanceOf(ApiClientError);
  });

  it("utilise des valeurs par défaut si le corps d'erreur est illisible", async () => {
    stubFetch(500, null);

    await expect(apiJson("/api/bands")).rejects.toMatchObject({
      status: 500,
      code: "UNKNOWN",
      message: "Erreur HTTP 500",
    });
  });

  it("échoue explicitement si l'enveloppe { data } est absente", async () => {
    stubFetch(200, { unexpected: true });

    await expect(apiJson("/api/bands")).rejects.toMatchObject({
      code: "BAD_ENVELOPE",
    });
  });

  it("propage le signal d'annulation à fetch", async () => {
    const fetchMock = stubFetch(200, { data: {} });
    const controller = new AbortController();

    await apiJson("/api/search", { signal: controller.signal });

    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });
});
