/**
 * Helpers partagés par les tests des route handlers (lib/api).
 * Mocke Redis, fournit une session configurable, des fabriques de
 * requêtes NextRequest et un query builder Drizzle chaînable factice.
 */

// Espions et vi.hoisted de Vitest
import { vi } from "vitest";
// Requête Next.js pour simuler les appels HTTP
import { NextRequest } from "next/server";

// Mock global de Redis avec commandes INCR/EXPIRE factices
vi.mock("@/lib/redis", () => ({
  redis: {
    incr: vi.fn(async () => 1),
    expire: vi.fn(async () => 1),
  },
}));

// Conteneur hoisté partagé entre les tests et le mock de @/lib/auth
const state = vi.hoisted(() => ({ current: null as any }));

/** Session mockée partagée entre les tests et le mock de `auth`. */
export const mockSession = state;

/**
 * Définit la session simulée pour le test en cours.
 *
 * @param role - Rôle à assigner, ou null pour un visiteur anonyme.
 * @param id - Identifiant utilisateur optionnel (défaut "u1").
 */
export function setUser(role: string | null, id = "u1") {
  mockSession.current = role
    ? { user: { id, role, email: `${id}@test.com` } }
    : null;
}

/**
 * Fabrique une NextRequest de test.
 *
 * @param url - URL complète (query string incluse).
 * @param method - Méthode HTTP.
 * @param body - Corps JSON optionnel ; ajoute l'en-tête content-type.
 */
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

/** Fabrique le second argument d'un route handler (params résolus). */
export function ctx(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) };
}

/**
 * Fabrique un query builder Drizzle factice : chaque méthode se
 * chaîne indéfiniment et l'objet est awaitable, résolvant `result`.
 *
 * @param result - Valeur renvoyée à la fin de la chaîne (await/returning).
 */
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
