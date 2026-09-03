/**
 * Tests des gardes RBAC (lib/rbac/guards.ts).
 * Vérifie les trois gardes utilisées par les Server Actions, et surtout le
 * repli `role ?? "user"` : une session sans rôle explicite doit être traitée
 * comme le rôle le plus faible, jamais comme un privilège implicite.
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach } from "vitest";
// Gardes sous test
import {
  ActionError,
  requireAuth,
  requireRole,
  requirePermission,
  requireSession,
} from "./guards";

// Conteneur hoisté : la session lue par le mock de @/lib/auth
const mockSession = vi.hoisted(() => ({ current: null as any }));

// next/headers throw hors contexte Next
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  // La résolution de langue lit le cookie avant l'en-tête : sans ce
  // substitut, toute action qui traduit un message échouerait ici.
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

/** Configure la session simulée ; `undefined` = utilisateur sans rôle. */
function setSession(role: string | null | undefined) {
  if (role === null) {
    mockSession.current = null;
    return;
  }
  mockSession.current = {
    user: { id: "u1", email: "t@t.local", ...(role ? { role } : {}) },
    session: { id: "s1" },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireSession / requireAuth", () => {
  it("lève une ActionError UNAUTHENTICATED sans session", async () => {
    setSession(null);
    await expect(requireSession()).rejects.toThrow(ActionError);
    await expect(requireSession()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("renvoie la session courante quand l'utilisateur est connecté", async () => {
    setSession("user");
    await expect(requireAuth()).resolves.toMatchObject({
      user: { id: "u1" },
    });
  });
});

describe("requireRole — hiérarchie des rôles", () => {
  it("autorise un rôle supérieur au minimum demandé", async () => {
    setSession("moderator");
    await expect(requireRole("contributor")).resolves.toBeDefined();
  });

  it("autorise un rôle strictement égal au minimum demandé", async () => {
    setSession("contributor");
    await expect(requireRole("contributor")).resolves.toBeDefined();
  });

  it("refuse un rôle insuffisant avec le code FORBIDDEN", async () => {
    setSession("user");
    await expect(requireRole("moderator")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("traite une session sans rôle comme un simple « user »", async () => {
    // Repli défensif : un compte dont le rôle n'a pas été projeté ne doit
    // jamais hériter d'un privilège par défaut.
    setSession(undefined);
    await expect(requireRole("contributor")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("requirePermission — matrice RBAC", () => {
  it("autorise une action présente dans la matrice du rôle", async () => {
    setSession("contributor");
    await expect(requirePermission("band", "create")).resolves.toBeDefined();
  });

  it("refuse une action absente de la matrice du rôle", async () => {
    setSession("contributor");
    await expect(requirePermission("band", "delete")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("traite une session sans rôle comme un simple « user »", async () => {
    setSession(undefined);
    await expect(requirePermission("band", "delete")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
