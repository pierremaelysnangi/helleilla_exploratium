/**
 * Client HTTP partagé des providers externes.
 * Fournit `fetchJson` : récupération JSON avec validation zod du contrat,
 * timeout, retry exponentiel sur erreurs transitoires, cache Redis
 * stale-while-revalidate et throttling par hôte (exigences MusicBrainz :
 * 1 req/s ; Discogs : ~60 req/min).
 *
 * Règle d'architecture : ces appels ne sortent JAMAIS du serveur — le
 * navigateur passe toujours par les routes internes (`/api/bands/:id/media`).
 */

// Validation des contrats de réponse des plateformes tierces
import { z } from "zod";
import { createHash } from "crypto";
// Cache partagé de l'application (stale-while-revalidate)
import { redis } from "@/lib/redis";

/** User-Agent identifiant l'application (exigé par MusicBrainz). */
export const PROVIDER_USER_AGENT =
  "HelleillaExploratium/0.1.0 (https://helleilla.local; contact@helleilla.local)";

/** Erreur provider : échec réseau/HTTP après épuisement des tentatives. */
export class ProviderError extends Error {
  constructor(
    public url: string,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Options de `fetchJson`. */
type FetchJsonOptions = {
  /** Durée de vie du cache Redis en secondes (défaut 24 h). */
  cacheTtlSeconds?: number;
  /** Timeout par tentative en ms (défaut 8 s). */
  timeoutMs?: number;
  /** Nombre de tentatives au total (défaut 2 : 1 initiale + 1 retry). */
  retries?: number;
  /** En-têtes additionnels (auth Discogs, Accept…). */
  headers?: Record<string, string>;
  /**
   * Intervalle minimal entre deux requêtes vers ce même hôte en ms
   * (throttling sortant, ex : 1100 pour MusicBrainz).
   */
  minIntervalMs?: number;
};

/**
 * Throttling sortant en mémoire par hôte : dernière émission + promesse
 * de fin de délai. Suffisant mono-instance ; le cache Redis amortit le
 * reste en multi-instances.
 */
const lastRequestAt = new Map<string, Promise<void>>();

/** Attend son tour selon l'intervalle minimal configuré pour l'hôte. */
async function throttle(host: string, minIntervalMs: number): Promise<void> {
  const previous = lastRequestAt.get(host) ?? Promise.resolve();
  const next = previous.then(async () => {
    await new Promise((r) => setTimeout(r, minIntervalMs));
  });
  lastRequestAt.set(host, next);
  await next;
}

/** Clé de cache : hash stable de l'URL (les secrets vont en header, jamais dans l'URL signée du cache). */
function cacheKey(url: string): string {
  return `provider:${createHash("sha1").update(url).digest("hex")}`;
}

/** Délai exponentiel : base * 2^tentative avec légère jitterisation. */
function backoffMs(attempt: number): number {
  return Math.min(500 * 2 ** attempt, 4000) + Math.floor(Math.random() * 200);
}

/**
 * Effectue une requête GET JSON vers un provider externe :
 * 1. cache Redis -> validation -> retour immédiat ;
 * 2. sinon fetch (timeout + throttling), retry sur 429/5xx/réseau ;
 * 3. validation zod stricte puis mise en cache du JSON brut.
 *
 * @typeParam T - Sortie typée du schéma zod.
 * @throws ProviderError si toutes les tentatives échouent.
 * @throws ZodError si la réponse ne respecte pas le contrat documenté.
 */
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  {
    cacheTtlSeconds = 86_400,
    timeoutMs = 8_000,
    retries = 2,
    headers = {},
    minIntervalMs = 0,
  }: FetchJsonOptions = {},
): Promise<T> {
  // 1. Cache Redis d'abord (jamais d'appel réseau si déjà connu)
  const key = cacheKey(url);
  const cached = await redis.get(key).catch(() => null);
  if (cached) {
    return schema.parse(JSON.parse(cached));
  }

  // 2. Requête réelle avec retries
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, backoffMs(attempt)));
    }
    if (minIntervalMs > 0) {
      await throttle(new URL(url).host, minIntervalMs);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": PROVIDER_USER_AGENT,
          Accept: "application/json",
          ...headers,
        },
      });

      // 429/5xx : transitoire -> nouvelle tentative
      if (res.status === 429 || res.status >= 500) {
        lastError = new ProviderError(url, `HTTP ${res.status}`, res.status);
        continue;
      }
      if (!res.ok) {
        // 4xx : permanent, inutile de retenter
        throw new ProviderError(url, `HTTP ${res.status}`, res.status);
      }

      const json: unknown = await res.json();
      const parsed = schema.parse(json);

      // 3. Mise en cache best-effort (une panne Redis ne casse rien)
      await redis
        .set(key, JSON.stringify(json), "EX", cacheTtlSeconds)
        .catch(() => undefined);

      return parsed;
    } catch (err) {
      // Contrat violé : erreur permanente, ni retry ni cache
      if (err instanceof z.ZodError) throw err;
      if (
        err instanceof ProviderError &&
        err.status !== undefined &&
        err.status < 500 &&
        err.status !== 429
      ) {
        throw err;
      }
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ProviderError(
    url,
    `Échec après ${retries} tentatives : ${String(lastError)}`,
  );
}
