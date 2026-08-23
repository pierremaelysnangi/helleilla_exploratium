import { vi } from "vitest";

const state = vi.hoisted(() => ({ current: null as any }));

export const mockSession = state;

export function setUser(role: string | null) {
  mockSession.current = role
    ? { user: { id: "u1", email: "t@t.local", role }, session: { id: "s1" } }
    : null;
}

export function expectAllowed(res: any) {
  if (!res.success) {
    throw new Error(`Attendu succès, reçu : ${JSON.stringify(res.error)}`);
  }
}

export function expectDenied(res: any) {
  if (res.success) {
    throw new Error(`Attendu échec, reçu succès`);
  }
}

export const fixtures = {
  album: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("bandId", "550e8400-e29b-41d4-a716-446655440001");
    fd.set("title", "Frozen Voidscape");
    fd.set("slug", "frozen-voidscape");
    fd.set("type", "album");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
  albumUpdate: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("id", "550e8400-e29b-41d4-a716-446655440002");
    fd.set("title", "Frozen Voidscape");
    fd.set("slug", "frozen-voidscape");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
  track: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("albumId", "550e8400-e29b-41d4-a716-446655440002");
    fd.set("title", "Ashes of the Frostmoon");
    fd.set("trackNumber", "1");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
  trackUpdate: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("id", "550e8400-e29b-41d4-a716-446655440003");
    fd.set("title", "Ashes of the Frostmoon");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
};
