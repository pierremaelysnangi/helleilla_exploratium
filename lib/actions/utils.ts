import { ActionError } from "@/lib/rbac/guards";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string | Record<string, unknown> };

export function handleActionError(err: unknown): {
  success: false;
  error: string;
} {
  if (err instanceof ActionError) return { success: false, error: err.message };
  console.error("[action]", err);
  return { success: false, error: "Erreur serveur inattendue." };
}
