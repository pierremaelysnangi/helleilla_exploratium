import { vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/redis", () => ({
  redis: {
    incr: vi.fn(async () => 1),
    expire: vi.fn(async () => 1),
  },
}));

const state = vi.hoisted(() => ({ current: null as any }));

export const mockSession = state;

export function setUser(role: string | null, id = "u1") {
  mockSession.current = role
    ? { user: { id, role, email: `${id}@test.com` } }
    : null;
}

export function mkReq(
  url = "http://localhost/api/test",
  method = "GET",
  body?: unknown,
) {
  return new NextRequest(url, {
    method,
    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }
      : {}),
  });
}

export function ctx(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) };
}

export function chain(result: unknown) {
  const c: any = {
    where: vi.fn(() => c),
    orderBy: vi.fn(() => c),
    limit: vi.fn(() => c),
    offset: vi.fn(() => c),
    values: vi.fn(() => c),
    set: vi.fn(() => c),
    returning: vi.fn(async () => result),
    from: vi.fn(() => c),
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  return c;
}
