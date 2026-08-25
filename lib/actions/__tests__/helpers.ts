/**
 * Helpers partagés par les tests des Server Actions (lib/actions/*.test.ts).
 * Fournit une session mockée configurable, des assertions de succès/échec
 * et des fabriques de FormData (fixtures) prêtes pour les actions.
 */

// vi : espions, mocks et vi.hoisted de Vitest
import { vi } from "vitest";

// Conteneur hoisté : la session courante est lue par le mock de @/lib/auth
const state = vi.hoisted(() => ({ current: null as any }));

/** Session mockée partagée entre les tests et le mock de `auth`. */
export const mockSession = state;

/**
 * Définit la session simulée pour le test en cours.
 *
 * @param role - Rôle à assigner ("user", "contributor", ...) ou null
 *               pour simuler un visiteur non authentifié.
 */
export function setUser(role: string | null) {
  mockSession.current = role
    ? { user: { id: "u1", email: "t@t.local", role }, session: { id: "s1" } }
    : null;
}

/**
 * Affirme que le résultat d'une action est un succès ;
 * lève une erreur explicite (avec le détail) sinon.
 *
 * @param res - Résultat renvoyé par une action (`ActionResult`).
 */
export function expectAllowed(res: any) {
  if (!res.success) {
    throw new Error(`Attendu succès, reçu : ${JSON.stringify(res.error)}`);
  }
}

/**
 * Affirme que le résultat d'une action est un échec ;
 * lève une erreur si l'action a abouti.
 *
 * @param res - Résultat renvoyé par une action (`ActionResult`).
 */
export function expectDenied(res: any) {
  if (res.success) {
    throw new Error(`Attendu échec, reçu succès`);
  }
}

/** Fabriques de FormData valides, avec champs surchargeables par test. */
export const fixtures = {
  /** FormData de création d'album valide. */
  album: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("bandId", "550e8400-e29b-41d4-a716-446655440001");
    fd.set("title", "Frozen Voidscape");
    fd.set("slug", "frozen-voidscape");
    fd.set("type", "album");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
  /** FormData de modification d'album valide. */
  albumUpdate: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("id", "550e8400-e29b-41d4-a716-446655440002");
    fd.set("title", "Frozen Voidscape");
    fd.set("slug", "frozen-voidscape");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
  /** FormData de création de piste valide. */
  track: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("albumId", "550e8400-e29b-41d4-a716-446655440002");
    fd.set("title", "Ashes of the Frostmoon");
    fd.set("trackNumber", "1");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
  /** FormData de modification de piste valide. */
  trackUpdate: (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("id", "550e8400-e29b-41d4-a716-446655440003");
    fd.set("title", "Ashes of the Frostmoon");
    for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
    return fd;
  },
};
