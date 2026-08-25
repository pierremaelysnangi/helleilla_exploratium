/**
 * Utilitaires partagés par les Server Actions (lib/actions/*).
 * Fournit le type de retour standardisé `ActionResult<T>` et le
 * gestionnaire d'erreurs commun `handleActionError`.
 */

// ActionError : erreur métier levée par les gardes RBAC (session/permission)
import { ActionError } from "@/lib/rbac/guards";

/**
 * Type de résultat unifié pour toutes les Server Actions.
 * - succès : `{ success: true, data }` avec les données retournées
 * - échec  : `{ success: false, error }` avec un message string ou
 *   une map d'erreurs de validation (zod flatten)
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string | Record<string, unknown> };

/**
 * Convertit une exception levée dans une action en résultat d'échec
 * exploitable par le client, sans jamais propager l'erreur brute.
 *
 * @param err - L'erreur interceptée (type inconnu).
 * @returns Un objet `{ success: false, error }` : message de l'ActionError
 *          si applicable, sinon message générique après log serveur.
 */
export function handleActionError(err: unknown): {
  success: false;
  error: string;
} {
  if (err instanceof ActionError) return { success: false, error: err.message };
  console.error("[action]", err);
  return { success: false, error: "Erreur serveur inattendue." };
}
