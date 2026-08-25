/**
 * GET /api/search — recherche globale multi-index (Meilisearch).
 * Interroge en une requête les index `bands`, `albums` et `tracks`
 * (alimentés de façon asynchrone par les jobs BullMQ) et renvoie une
 * réponse groupée par type d'entité. Accès public, rate limité.
 */

// Wrapper standard : validation zod + rate limiting + gestion d'erreurs
import { route } from "@/lib/api/handler";
// Réponse de succès standardisée + exception convertie en 503
import { ok } from "@/lib/api/response";
import { ApiError } from "@/lib/api/response";
// Schéma des query params et du corps de réponse typé
import {
  globalSearchQuerySchema,
  globalSearchResponseSchema,
} from "@/lib/api/schemas";
// Client Meilisearch partagé (multi-search sur les 3 index)
import { meilisearch } from "@/lib/search/meilisearch";

/**
 * GET /api/search?q=...&limit=...
 *
 * Exécute un `multiSearch` Meilisearch sur les trois index avec le même
 * terme et la même limite par index. La sortie est validée par
 * `globalSearchResponseSchema` avant sérialisation : un document
 * malformé dans un index est remonté en 500 (données d'index corrompues)
 * plutôt que propagé au client.
 *
 * @returns 200 `{ bands, albums, tracks }` — tableaux d'objets bruts
 *   d'index, sans jointure SQL (les clients résolvent les détails via
 *   les routes dédiées). 503 si Meilisearch est indisponible.
 * Rate limit : 30 requêtes/minute par IP.
 */
export const GET = route(
  { query: globalSearchQuerySchema, rateLimit: { limit: 30, window: 60 } },
  async ({ query }) => {
    const { q, limit } = query;

    let results;
    try {
      results = await meilisearch.multiSearch({
        queries: [
          { indexUid: "bands", q, limit },
          { indexUid: "albums", q, limit },
          { indexUid: "tracks", q, limit },
        ],
      });
    } catch (err) {
      // Indispo moteur de recherche : erreur explicite, non masquée en 500
      console.error("[search] Meilisearch indisponible:", err);
      throw new ApiError(
        "UNAVAILABLE",
        "Moteur de recherche indisponible, réessayez plus tard",
      );
    }

    const [bands, albums, tracks] = results.results.map((r) => r.hits);

    // Garantie de contrat : on ne sert que ce que les schémas décrivent.
    // Un document d'index malformé est une erreur SERVEUR (données
    // corrompues côté indexation), pas une erreur client -> 500.
    const parsed = globalSearchResponseSchema.safeParse({
      bands,
      albums,
      tracks,
    });
    if (!parsed.success) {
      console.error("[search] Document indexé invalide:", parsed.error);
      throw new ApiError("INTERNAL", "Résultats de recherche invalides");
    }

    return ok(parsed.data);
  },
);
