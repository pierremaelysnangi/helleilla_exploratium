/**
 * Imports :
 * - `route` : wrapper standardisant les handlers d'API
 *   (validation, permissions, rate limiting, gestion d'erreurs).
 * - `ok` / `fail` : constructeurs de réponses JSON de succès / erreur.
 * - `idParamSchema` : schéma Zod validant que le paramètre `[id]` est un UUID.
 * - `updateTrackBodySchema` : schéma Zod du corps PATCH pour une piste.
 * - `db` + `tracks` : client Drizzle ORM et table `tracks`.
 * - `eq` : opérateur d'égalité SQL de Drizzle.
 * - `trackIndexQueue` : file BullMQ pour l'(dés)indexation dans le moteur de recherche.
 */
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateTrackBodySchema } from "@/lib/validations/track";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { trackIndexQueue } from "@/lib/queue/client";

/**
 * GET /api/tracks/:id — récupère une piste par son identifiant.
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @returns 200 avec la piste, ou 404 NOT_FOUND si introuvable.
 * Limité à 60 requêtes par minute (endpoint public en lecture).
 */
export const GET = route(
  { params: idParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ params }) => {
    const [track] = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, params.id))
      .limit(1);
    if (!track) return fail("NOT_FOUND", "Piste introuvable");
    return ok(track);
  },
);

/**
 * PATCH /api/tracks/:id — met à jour partiellement une piste.
 *
 * Réservé aux utilisateurs ayant la permission `track:update`
 * (contributor et au-delà). Rate limit strict (10/min, failMode "closed").
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @param body - Corps de requête validé par `updateTrackBodySchema`.
 * @returns 200 avec la piste mise à jour, ou 404 si introuvable.
 * Un job de réindexation est ajouté après la mise à jour réussie.
 */
export const PATCH = route(
  {
    params: idParamSchema,
    body: updateTrackBodySchema,
    permission: { resource: "track", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    const [track] = await db
      .update(tracks)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tracks.id, params.id))
      .returning();
    if (!track) return fail("NOT_FOUND", "Piste introuvable");

    await trackIndexQueue.add("index", { trackId: track.id, action: "index" });
    return ok(track);
  },
);

/**
 * DELETE /api/tracks/:id — supprime une piste.
 *
 * Réservé aux utilisateurs ayant la permission `track:delete`
 * (moderator et au-delà).
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @returns 200 avec `{ deleted: true }`, ou 404 si introuvable.
 * Un job de désindexation est ajouté après suppression réussie.
 */
export const DELETE = route(
  {
    params: idParamSchema,
    permission: { resource: "track", action: "delete" },
    rateLimit: { limit: 5, window: 60, failMode: "closed" },
  },
  async ({ params }) => {
    const [track] = await db
      .delete(tracks)
      .where(eq(tracks.id, params.id))
      .returning();
    if (!track) return fail("NOT_FOUND", "Piste introuvable");

    await trackIndexQueue.add("delete", {
      trackId: params.id,
      action: "delete",
    });
    return ok({ deleted: true });
  },
);
