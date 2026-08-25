/**
 * Tests du vérificateur Turnstile (lib/auth/turnstile.ts).
 * fetch stubé et secret pilotable : vérifie la désactivation sans clé,
 * le rejet d'un token manquant, l'appel siteverify avec IP et le
 * fail-closed en cas d'erreur réseau.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

const envMock = vi.hoisted(() => ({
  TURNSTILE_SECRET_KEY: undefined as string | undefined,
}));
vi.mock("@/lib/env", () => ({ env: envMock }));

const { verifyTurnstileToken } = await import("./turnstile");

/** Stub fetch renvoyant un payload JSON avec statut. */
function stubFetch(payload: unknown, status = 200, shouldThrow = false) {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) => {
      if (shouldThrow) throw new Error("network unreachable");
      return new Response(JSON.stringify(payload), { status });
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyTurnstileToken", () => {
  it("retourne true quand le CAPTCHA est désactivé (pas de secret)", async () => {
    envMock.TURNSTILE_SECRET_KEY = undefined;
    expect(await verifyTurnstileToken(undefined, "1.2.3.4")).toBe(true);
    expect(await verifyTurnstileToken("token-forgé", "1.2.3.4")).toBe(true);
  });

  it("rejette une requête sans token quand activée (fail-closed)", async () => {
    envMock.TURNSTILE_SECRET_KEY = "secret-key-123456";
    const fetchMock = stubFetch({ success: true });
    expect(await verifyTurnstileToken(null, "1.2.3.4")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valide un token correct auprès de siteverify avec l'IP", async () => {
    envMock.TURNSTILE_SECRET_KEY = "secret-key-123456";
    const fetchMock = stubFetch({ success: true });

    expect(await verifyTurnstileToken("tok-ok", "1.2.3.4")).toBe(true);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.secret).toBe("secret-key-123456");
    expect(body.response).toBe("tok-ok");
    expect(body.remoteip).toBe("1.2.3.4");
  });

  it("rejette un token refusé par Cloudflare", async () => {
    envMock.TURNSTILE_SECRET_KEY = "secret-key-123456";
    stubFetch({ success: false, "error-codes": ["invalid-input-response"] });
    expect(await verifyTurnstileToken("tok-bad", undefined)).toBe(false);
  });

  it("fail-closed : indisponibilité réseau -> rejet, jamais de contournement", async () => {
    envMock.TURNSTILE_SECRET_KEY = "secret-key-123456";
    stubFetch({}, 500, true);
    expect(await verifyTurnstileToken("tok-x", undefined)).toBe(false);
  });
});
