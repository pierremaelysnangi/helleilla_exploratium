/**
 * Imports :
 * - `route` : wrapper standardisant les handlers d'API
 *   (validation, permissions, rate limiting, gestion d'erreurs).
 * - `ok` / `fail` : constructeurs de réponses JSON de succès / erreur.
 * - `idParamSchema` : schéma Zod validant que le paramètre `[id]` est un UUID.
 * - `updateGenreBodySchema` : schéma Zod du corps PATCH pour un genre.
 * - `db` + `genres` : client Drizzle ORM et table `genres`.
 * - `eq` : opérateur d'égalité SQL de Drizzle.
 */
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateGenreBodySchema } from "@/lib/validations/genre";
import { db } from "@/db";
import { genres } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/genres/:id — récupère un genre par son identifiant.
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @returns 200 avec le genre, ou 404 NOT_FOUND si introuvable.
 * Limité à 60 requêtes par minute (endpoint public en lecture).
 */
export const GET = route(
  { params: idParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ params }) => {
    const [genre] = await db
      .select()
      .from(genres)
      .where(eq(genres.id, params.id))
      .limit(1);
    if (!genre) return fail("NOT_FOUND", "Genre introuvable");
    return ok(genre);
  },
);

/**
 * PATCH /api/genres/:id — met à jour partiellement un genre.
 *
 * Réservé aux utilisateurs ayant la permission `genre:update`
 * (moderator et au-delà). Rate limit strict (10/min, failMode "closed").
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @param body - Corps de requête validé par `updateGenreBodySchema`.
 * @returns 200 avec le genre mis à jour, ou 404 si introuvable.
 */
export const PATCH = route(
  {
    params: idParamSchema,
    body: updateGenreBodySchema,
    permission: { resource: "genre", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    const [genre] = await db
      .update(genres)
      .set(body)
      .where(eq(genres.id, params.id))
      .returning();
    if (!genre) return fail("NOT_FOUND", "Genre introuvable");
    return ok(genre);
  },
);

/**
 * DELETE /api/genres/:id — supprime un genre.
 *
 * Réservé aux utilisateurs ayant la permission `genre:delete`
 * (moderator et au-delà). Contrairement aux albums, aucune file
 * d'indexation n'est sollicitée ici.
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @returns 200 avec `{ deleted: true }`, ou 404 si introuvable.
 */
export const DELETE = route(
  {
    params: idParamSchema,
    permission: { resource: "genre", action: "delete" },
    rateLimit: { limit: 5, window: 60, failMode: "closed" },
  },
  async ({ params }) => {
    const [genre] = await db
      .delete(genres)
      .where(eq(genres.id, params.id))
      .returning();
    if (!genre) return fail("NOT_FOUND", "Genre introuvable");
    return ok({ deleted: true });
  },
);
