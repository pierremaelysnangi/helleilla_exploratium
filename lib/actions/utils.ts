export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string | Record<string, unknown> };

export function handleActionError(err: unknown): { success: false; error: string } {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") return { success: false, error: "Non authentifié." };
    if (err.message === "FORBIDDEN") return { success: false, error: "Permission refusée." };
  }
  console.error(err);
  return { success: false, error: "Erreur serveur inattendue." };
}