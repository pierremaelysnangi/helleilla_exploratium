/**
 * POST /api/revalidate — purge ciblée du cache ISR Next.js.
 * Endpoint machine-to-machine (webhook CMS, script ops) : authentifié
 * par le header `x-revalidate-secret`, pas par session utilisateur.
 * Désactivé (503) tant que REVALIDATE_SECRET n'est pas configuré.
 */

// Validation du corps de requête
import { z } from "zod";
// Wrapper standard : rate limit + gestion d'erreurs (pas d'auth session)
import { route } from "@/lib/api/handler";
// Réponses standard + erreur typée pour les cas métier
import { ok, ApiError } from "@/lib/api/response";
// Secret partagé validé au boot ; absent = endpoint désactivé
import { env } from "@/lib/env";
// Purges du cache App Router : par chemin ou par tag de cache
import { revalidatePath, revalidateTag } from "next/cache";

/** Corps accepté : un chemin exact OU un tag de cache (au moins un). */
const revalidateBodySchema = z
  .object({
    /** Chemin à invalider, ex : "/bands/necrofrost". */
    path: z.string().trim().min(1).max(500).optional(),
    /** Tag de cache à invalider (revalidateTag). */
    tag: z.string().trim().min(1).max(100).optional(),
  })
  .refine((body) => body.path !== undefined || body.tag !== undefined, {
    message: "Fournir 'path' et/ou 'tag'",
  });

/**
 * POST /api/revalidate — invalide le cache ISR.
 *
 * Sécurité : header `x-revalidate-secret` obligatoire (comparaison
 * constante si disponible), rate limit strict fail-closed.
 *
 * @returns 200 avec la liste de ce qui a été purgé.
 */
export const POST = route(
  {
    body: revalidateBodySchema,
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ req, body }) => {
    // Désactivation explicite tant que le secret n'est pas configuré
    if (!env.REVALIDATE_SECRET) {
      throw new ApiError(
        "UNAVAILABLE",
        "Révalidation désactivée : REVALIDATE_SECRET non configuré",
      );
    }

    // Comparaison en temps constant pour éviter une attaque temporelle
    const provided = req.headers.get("x-revalidate-secret") ?? "";
    if (!timingSafeEqual(provided, env.REVALIDATE_SECRET)) {
      throw new ApiError("UNAUTHORIZED", "Secret de révalidation invalide");
    }

    const invalidated: string[] = [];
    if (body.path) {
      revalidatePath(body.path);
      invalidated.push(`path:${body.path}`);
    }
    if (body.tag) {
      // Next 16 : le second argument (profil cacheLife) est requis ;
      // "max" purge la valeur la plus persistante du tag.
      revalidateTag(body.tag, "max");
      invalidated.push(`tag:${body.tag}`);
    }

    return ok({ invalidated });
  },
);

/** Comparaison de chaînes en temps constant (fallback si crypto indispo). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
