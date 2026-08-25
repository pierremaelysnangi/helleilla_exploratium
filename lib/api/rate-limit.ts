/**
 * Rate limiting en sliding window log, adossé à Redis.
 * Fournit `rateLimit()` (retourne une Response 429 ou null) et
 * `clientIp()` (extraction de l'IP derrière un reverse proxy).
 */

// Client Redis partagé de l'application
import { redis } from "@/lib/redis";
// Réponse d'erreur 429 standardisée
import { fail } from "./response";

/** Options de limitation : clé, plafond, fenêtre et comportement en cas d'échec. */
type Opts = {
  key: string;
  limit: number;
  window: number; // secondes
  /**
   * Comportement si Redis est indisponible.
   * - 'open'   : on laisse passer (par défaut, adapté aux routes non critiques)
   * - 'closed' : on bloque (à réserver aux routes sensibles : auth, admin...)
   */
  failMode?: "open" | "closed";
};

// Version du schéma de clé — permet de changer d'algorithme plus tard
// sans collision avec d'anciennes entrées (ex: migration vers GCRA).
const KEY_VERSION = "v1";

// Script Lua : sliding window log, exécution atomique côté serveur Redis.
//
// KEYS[1] = clé du ZSET
// ARGV[1] = now (ms)
// ARGV[2] = window (ms)
// ARGV[3] = limit
// ARGV[4] = identifiant unique de la requête (membre du ZSET)
//
// Retour : { allowed(0|1), remaining, resetAtMs }
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

local windowStart = now - window
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window)
  return {1, limit - count - 1, now + window}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetAt = now + window
  if oldest[2] ~= nil then
    resetAt = tonumber(oldest[2]) + window
  end
  return {0, 0, resetAt}
end
`;

let cachedSha: string | null = null;

/** Charge le script Lua une seule fois et met le SHA en cache mémoire. */
async function getScriptSha(): Promise<string> {
  if (cachedSha) return cachedSha;
  cachedSha = (await redis.script("LOAD", SLIDING_WINDOW_SCRIPT)) as string;
  return cachedSha;
}

/**
 * Évalue le script sliding window via EVALSHA, avec repli sur un
 * rechargement du script si Redis renvoie NOSCRIPT.
 *
 * @param key - Clé Redis du ZSET (fenêtre glissante).
 * @param now - Horodatage courant en ms.
 * @param windowMs - Taille de la fenêtre en millisecondes.
 * @param limit - Nombre maximal de requêtes autorisées dans la fenêtre.
 * @returns Un tuple `[allowed (0|1), remaining, resetAtMs]`.
 */
async function evalSlidingWindow(
  key: string,
  now: number,
  windowMs: number,
  limit: number,
): Promise<[number, number, number]> {
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const sha = await getScriptSha();
    const res = await redis.evalsha(sha, 1, key, now, windowMs, limit, member);
    return res as [number, number, number];
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("NOSCRIPT")) {
      // Le script a été évincé du cache Redis : on invalide notre cache local
      // et on recharge avant de réessayer une seule fois.
      cachedSha = null;
      const sha = await getScriptSha();
      const res = await redis.evalsha(
        sha,
        1,
        key,
        now,
        windowMs,
        limit,
        member,
      );
      return res as [number, number, number];
    }
    throw err;
  }
}

/** Informations de limitation exposées dans les en-têtes de réponse. */
export type RateLimitInfo = {
  limit: number;
  remaining: number;
  reset: number; // timestamp unix en secondes
};

/**
 * Applique une limite de débit en sliding window.
 * Retourne une Response 429 si la limite est dépassée, sinon `null`
 * (le handler peut alors continuer normalement).
 *
 * En cas d'indispo Redis : fail-open par défaut, fail-closed si demandé.
 */
export async function rateLimit({
  key,
  limit,
  window,
  failMode = "open",
}: Opts) {
  const k = `rl:${KEY_VERSION}:${key}`;
  const now = Date.now();
  const windowMs = window * 1000;

  try {
    const [allowed, , resetAtMs] = await evalSlidingWindow(
      k,
      now,
      windowMs,
      limit,
    );

    if (allowed === 0) {
      const retryAfter = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
      const res = fail(
        "RATE_LIMIT",
        `Trop de requêtes (max ${limit}/${window}s)`,
      );
      res.headers.set("Retry-After", String(retryAfter));
      res.headers.set("X-RateLimit-Limit", String(limit));
      res.headers.set("X-RateLimit-Remaining", "0");
      res.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAtMs / 1000)));
      return res;
    }

    return null;
  } catch (err) {
    console.error("[rate-limit] Redis error:", err);

    if (failMode === "closed") {
      const res = fail(
        "RATE_LIMIT",
        "Service de limitation indisponible, réessayez plus tard",
      );
      res.headers.set("Retry-After", "5");
      return res;
    }

    return null;
  }
}

/**
 * Extrait l'adresse IP du client depuis les en-têtes de proxy usuels.
 * Lit d'abord la première IP de `x-forwarded-for`, puis `x-real-ip`,
 * et retourne "unknown" en dernier recours.
 *
 * @param req - Requête HTTP entrante.
 * @returns L'IP client (string) ou "unknown".
 */
export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Réinitialise le cache du SHA du script (usage exclusif en tests). */
// Exporté uniquement pour les tests
export function __resetScriptCache() {
  cachedSha = null;
}
