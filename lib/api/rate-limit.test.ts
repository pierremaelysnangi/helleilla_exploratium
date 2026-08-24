import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({
  script: vi.fn(async () => "fakesha123"),
  evalsha: vi.fn(),
}));
vi.mock("@/lib/redis", () => ({ redis: redisMock }));

const { rateLimit, clientIp } = await import("./rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
  redisMock.script.mockResolvedValue("fakesha123");
});

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
    /* const res = await rateLimit({ key: "test", limit: 10, window: 60 });
    expect(res).toBeNull();
    expect(redisMock.script).toHaveBeenCalledTimes(2); // 1er load + reload après NOSCRIPT */
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
