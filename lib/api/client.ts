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

// Base des URLs d'API (configurable via variable d'environnement).
// `||` et non `??` : une variable définie mais VIDE doit aussi retomber sur
// le défaut, sinon `new URL()` reçoit une base invalide.
const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

/**
 * Lecture publique d'une ressource depuis un composant serveur, en
 * déballant l'enveloppe `{ data }` et en distinguant « absent » de « en
 * panne ».
 *
 * Retourne `null` UNIQUEMENT sur 404, pour que l'appelant réponde
 * `notFound()`. Toute autre erreur est propagée : une base indisponible
 * doit déclencher la frontière d'erreur, jamais se déguiser en 404.
 *
 * @param path - Chemin de l'API (ex : "/api/genres/by-slug/black-metal").
 * @param schema - Schéma zod du contenu de `data`.
 * @param opts - Fenêtre de revalidation ISR (60 s par défaut) et signal.
 * @returns Les données validées, ou `null` si la ressource n'existe pas.
 */
export async function fetchPublicOrNull<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  opts: { revalidate?: number; signal?: AbortSignal } = {},
): Promise<z.infer<S> | null> {
  try {
    // L'inférence de `z.object({ data: S })` avec S générique dépasse ce
    // que TypeScript sait résoudre en zod v4. La validation runtime est
    // bien faite par apiFetch ; on ne restaure ici que le type de sortie.
    const payload = (await apiFetch(path, z.object({ data: schema }), {
      revalidate: opts.revalidate ?? 60,
      signal: opts.signal,
    })) as { data: z.infer<S> };
    return payload.data;
  } catch (err) {
    if (err instanceof ApiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

// Ré-export pour que les consommateurs du client aient ApiError sous la main
export { ApiError };
