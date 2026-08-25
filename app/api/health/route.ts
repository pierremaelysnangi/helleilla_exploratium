/**
 * GET /api/health — sonde de disponibilité pour la CI et le monitoring.
 * Vérifie les dépendances critiques (PostgreSQL, Redis, Meilisearch) en
 * parallèle avec un timeout court. Ne révèle aucune information
 * sensible : seuls des statuts agrégés sont exposés.
 */

// Wrapper standard (rate limit) + réponse de succès standardisée
import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
// Accès SQL brut léger (SELECT 1) via le pool Drizzle
import { sql } from "drizzle-orm";
import { db } from "@/db";
// Clients Redis et Meilisearch partagés
import { redis } from "@/lib/redis";
import { meilisearch } from "@/lib/search/meilisearch";

/** Statut d'une dépendance après probe. */
type DependencyStatus = {
  status: "up" | "down";
  /** Latence arrondie en ms (présente seulement si up). */
  latencyMs?: number;
};

/** Exécute une probe avec timeout ; retourne up/down + latence. */
async function probe(
  fn: () => Promise<unknown>,
  timeoutMs = 2_000,
): Promise<DependencyStatus> {
  const start = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs),
      ),
    ]);
    return { status: "up", latencyMs: Date.now() - start };
  } catch {
    return { status: "down" };
  }
}

/**
 * GET /api/health — vérifie PostgreSQL, Redis et Meilisearch.
 *
 * @returns 200 si toutes les dépendances répondent, sinon 503.
 * Corps : `{ data: { status, dependencies: { postgres, redis, meilisearch } } }`.
 * Rate limit : 60 requêtes/minute par IP (sonde, pas un endpoint métier).
 */
export const GET = route({ rateLimit: { limit: 60, window: 60 } }, async () => {
  const dependencies = {
    postgres: await probe(() => db.execute(sql`SELECT 1`)),
    redis: await probe(() => redis.ping()),
    meilisearch: await probe(() => meilisearch.health()),
  };

  const allUp = Object.values(dependencies).every((d) => d.status === "up");

  return ok(
    { status: allUp ? "healthy" : "degraded", dependencies },
    { status: allUp ? 200 : 503 },
  );
});
