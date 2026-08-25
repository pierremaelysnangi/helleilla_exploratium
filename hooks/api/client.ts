/**
 * Client HTTP navigateur pour l'API interne `/api/*`.
 * Contrairement à `lib/api/client.ts` (orienté RSC + cache Next.js), ce
 * module est conçu pour TanStack Query côté client : fetch simple,
 * cookies de session inclus, et conversion des erreurs API en une
 * exception typée `ApiClientError` exploitable par les mutations.
 */

/** Requête échouée côté serveur : statut HTTP + corps d'erreur standard. */
export class ApiClientError extends Error {
  /** Code métier renvoyé par l'API (ex : "VALIDATION", "FORBIDDEN"). */
  code: string;
  /** Statut HTTP de la réponse. */
  status: number;
  /** Détails additionnels (issues zod, etc.) si fournis par l'API. */
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiJsonOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Corps JSON sérialisé automatiquement (ignoré pour GET). */
  body?: unknown;
  /** Query params sérialisés dans l'URL ; valeurs null/undefined ignorées. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Signal d'annulation propagé à fetch (utile avec TanStack Query). */
  signal?: AbortSignal;
};

/**
 * Requête partagée : construit l'URL, exécute fetch avec les cookies de
 * session et convertit les erreurs non-2xx en ApiClientError.
 * Retourne la charge utile JSON brute (déballage selon l'appelant).
 */
async function request(
  path: string,
  { method = "GET", body, query, signal }: ApiJsonOptions = {},
): Promise<unknown> {
  const url = new URL(path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url, {
    method,
    signal,
    credentials: "include",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // L'API renvoie toujours un JSON parsable ; on se protège quand même
  const payload: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const err =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null
        ? (payload.error as {
            code?: string;
            message?: string;
            details?: unknown;
          })
        : {};
    throw new ApiClientError(
      res.status,
      err.code ?? "UNKNOWN",
      err.message ?? `Erreur HTTP ${res.status}`,
      err.details,
    );
  }

  return payload;
}

/**
 * Exécute un appel et retourne la charge utile brute, sans déballage.
 * À utiliser pour les réponses paginées `{ data, meta }` où l'on doit
 * conserver les métadonnées.
 *
 * @param path - Chemin de l'API commençant par "/api/...".
 * @param options - Méthode, corps, query et signal.
 */
export async function apiJsonEnvelope(
  path: string,
  options: ApiJsonOptions = {},
): Promise<unknown> {
  return request(path, options);
}

/**
 * Exécute un appel JSON vers l'API et déballer l'enveloppe `{ data }`.
 *
 * - `credentials: "include"` : le cookie de session Better Auth est envoyé.
 * - Réponse non-2xx -> `ApiClientError` construit depuis `{ error }`.
 * - Réponse 2xx sans enveloppe connue -> erreur de contrat explicite.
 *
 * @typeParam T - Type du champ `data` après déballage.
 * @param path - Chemin de l'API commençant par "/api/...".
 * @param options - Méthode, corps, query et signal.
 * @returns Le contenu du champ `data`.
 */
export async function apiJson<T>(
  path: string,
  options: ApiJsonOptions = {},
): Promise<T> {
  const payload = await request(path, options);

  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return payload.data as T;
  }

  throw new ApiClientError(
    200,
    "BAD_ENVELOPE",
    `Réponse inattendue de ${path} : enveloppe { data } manquante`,
  );
}
