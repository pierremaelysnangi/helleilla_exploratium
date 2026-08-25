/**
 * GET /api/bands/:id/media — DTO média agrégé du groupe.
 * Résolution à la demande depuis les providers externes via les
 * références en base (voir lib/media/resolver.ts) : aucun média
 * n'est stocké localement, seules des URLs officielles circulent.
 */

// Wrapper standard : rate limit + gestion d'erreurs (lecture publique)
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
// Resolver agrégé + invalidation par query ?refresh=1
import { resolveBandMedia, type BandMedia } from "@/lib/media/resolver";

/**
 * GET /api/bands/:id/media — infos + images + liens + previews.
 *
 * Cache Redis 24 h côté resolver ; `?refresh=1` force une résolution
 * fraîche. En cas de panne partielle des providers, la réponse reste
 * 200 avec `degraded: true` et les données disponibles.
 *
 * @returns 200 BandMedia, ou 404 si le groupe n'existe pas.
 */
export const GET = route(
  { params: idParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ req, params }) => {
    const refresh =
      req.nextUrl.searchParams.get("refresh") === "1" ? true : false;
    try {
      const media: BandMedia = await resolveBandMedia(params.id, {
        force: refresh,
      });
      return ok(media);
    } catch (err) {
      // Seul cas : groupe introuvable (les providers sont tolérants aux pannes)
      if (
        err instanceof Error &&
        err.message.startsWith("Groupe introuvable")
      ) {
        return fail("NOT_FOUND", err.message);
      }
      throw err;
    }
  },
);
