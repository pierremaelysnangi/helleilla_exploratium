/**
 * Tests du rate limiting (lib/api/rate-limit.ts).
 * Couvre le passage sous la limite, le blocage 429 avec en-têtes
 * Retry-After/X-RateLimit-*, le rechargement du script après NOSCRIPT,
 * et les modes fail-open / fail-closed quand Redis est indisponible.
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach } from "vitest";
// Helper interne pour vider le cache de SHA entre les tests
import { __resetScriptCache } from "./rate-limit";

// Mock Redis hoisté : script() renvoie un SHA fixe, evalsha est piloté par test
const redisMock = vi.hoisted(() => ({
  script: vi.fn(async () => "fakesha123"),
  evalsha: vi.fn(),
}));
vi.mock("@/lib/redis", () => ({ redis: redisMock }));

// Annule un éventuel mock global du module sous test, puis import réel
vi.unmock("@/lib/api/rate-limit");

// Import dynamique après configuration des mocks
const { rateLimit, clientIp } = await import("./rate-limit");

// État propre avant chaque test : SHA réinitialisé + mocks reconfigurés
beforeEach(() => {
  __resetScriptCache();
  vi.clearAllMocks();
  redisMock.script.mockResolvedValue("fakesha123");
});

// Suite : comportement de la fonction rateLimit
describe("rateLimit", () => {
  it("laisse passer si sous la limite", async () => {
    redisMock.evalsha.mockResolvedValue([1, 9, Date.now() + 60000]);
    const res = await rateLimit({ key: "test", limit: 10, window: 60 });
    expect(res).toBeNull();
  });

  it("bloque avec 429 si limite atteinte", async () => {
    const resetAt = Date.now() + 30000;
    redisMock.evalsha.mockResolvedValue([0, 0, resetAt]);
    const res = await rateLimit({ key: "test", limit: 10, window: 60 });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get("Retry-After")).toBeTruthy();
    expect(res!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("recharge le script sur NOSCRIPT puis réessaie", async () => {
    redisMock.evalsha
      .mockRejectedValueOnce(new Error("NOSCRIPT No matching script"))
      .mockResolvedValueOnce([1, 5, Date.now() + 60000]);

    const res = await rateLimit({ key: "test", limit: 10, window: 60 });

    expect(res).toBeNull(); // sous la limite -> pas de blocage
    expect(redisMock.script).toHaveBeenCalledTimes(2); // 1er load + reload après NOSCRIPT
  });

  it("fail-open par défaut si Redis est down", async () => {
    redisMock.evalsha.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await rateLimit({ key: "test", limit: 10, window: 60 });
    expect(res).toBeNull();
  });

  it("fail-closed si configuré et Redis down", async () => {
    redisMock.evalsha.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await rateLimit({
      key: "test",
      limit: 10,
      window: 60,
      failMode: "closed",
    });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
  });
});

// Suite : extraction de l'IP client depuis les en-têtes de proxy
describe("clientIp", () => {
  it("extrait la première IP de x-forwarded-for", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("fallback sur x-real-ip", () => {
    const req = new Request("http://x", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(clientIp(req)).toBe("9.9.9.9");
  });

  it("retourne unknown si rien", () => {
    const req = new Request("http://x");
    expect(clientIp(req)).toBe("unknown");
  });
});
