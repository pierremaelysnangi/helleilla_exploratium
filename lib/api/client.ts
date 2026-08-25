/**
 * Client HTTP typé pour consommer l'API interne côté serveur (RSC).
 * Enrobe `fetch` avec construction d'URL, sérialisation JSON, options de
 * cache Next.js (revalidate/tags) et validation zod de la réponse.
 */

// Validation du corps de réponse via un schéma zod
import { z } from "zod";
// Erreur applicative standardisée levée sur réponse non-2xx
import { ApiError } from "./response";

/** Options du client : méthode, corps, query string, cache et abort. */
type FetchOpts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  revalidate?: number | false;
  tags?: string[];
  signal?: AbortSignal;
};

// Base des URLs d'API (configurable via variable d'environnement)
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Effectue une requête vers l'API et retourne la réponse validée.
 *
 * @param path - Chemin de l'API (absolu ou relatif à BASE).
 * @param schema - Schéma zod validant le corps JSON de la réponse ;
 *                 son type paramètre la valeur de retour.
 * @param opts - Options optionnelles : méthode, body, query, cache, signal.
 * @returns Les données désérialisées et validées (`z.infer<S>`).
 * @throws ApiError si le statut HTTP n'est pas 2xx ou si le JSON est invalide.
 */
export async function apiFetch<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  opts: FetchOpts = {},
): Promise<z.infer<S>> {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE);

  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: opts.body ? { "content-type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    next:
      opts.revalidate !== undefined || opts.tags
        ? { revalidate: opts.revalidate, tags: opts.tags }
        : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      json?.error?.code ?? "INTERNAL",
      json?.error?.message ?? res.statusText,
      json?.error?.details,
    );
  }

  return schema.parse(json);
}

// Ré-export pour que les consommateurs du client aient ApiError sous la main
export { ApiError };
