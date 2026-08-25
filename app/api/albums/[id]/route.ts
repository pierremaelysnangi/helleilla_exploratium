/**
 * Imports :
 * - `route` : enveloppe (wrapper) standardisant les handlers d'API
 *   (validation, permissions, rate limiting, gestion d'erreurs).
 * - `ok` / `fail` : constructeurs de réponses JSON de succès / erreur.
 * - `idParamSchema` : schéma Zod validant que le paramètre `[id]` est un UUID.
 * - `updateAlbumBodySchema` : schéma Zod du corps PATCH pour un album.
 * - `db` + `albums` : client Drizzle ORM et table `albums`.
 * - `eq` : opérateur d'égalité SQL de Drizzle.
 * - `albumIndexQueue` / `trackIndexQueue` : files BullMQ pour l'indexation
 *   (et désindexation) des albums et pistes dans le moteur de recherche.
 * - `listTrackIdsByAlbumId` : requête utilitaire listant les ids des pistes
 *   d'un album (utilisée avant suppression en cascade).
 */
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateAlbumBodySchema } from "@/lib/validations/album";
import { db } from "@/db";
import { albums } from "@/db/schema";
import { eq } from "drizzle-orm";
import { albumIndexQueue, trackIndexQueue } from "@/lib/queue/client";
import { listTrackIdsByAlbumId } from "@/db/queries/tracks";

/**
 * GET /api/albums/:id — récupère un album par son identifiant.
 *
 * @param params - Paramètres de route validés par `idParamSchema` (`id` UUID).
 * @returns 200 avec l'album, ou 404 NOT_FOUND si introuvable.
 * Limité à 60 requêtes par minute.
 */
export const GET = route(
  { params: idParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ params }) => {
    const [album] = await db
      .select()
      .from(albums)
      .where(eq(albums.id, params.id))
      .limit(1);
    if (!album) return fail("NOT_FOUND", "Album introuvable");
    return ok(album);
  },
);

/**
 * PATCH /api/albums/:id — met à jour partiellement un album.
 *
 * Réservé aux utilisateurs ayant la permission `album:update`
 * (contributor et au-delà). Rate limit plus strict (10/min) en mode
 * "closed" : si Redis est indisponible, les requêtes sont rejetées.
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @param body - Corps de la requête validé par `updateAlbumBodySchema`.
 * @returns 200 avec l'album mis à jour, ou 404 si introuvable.
 * Un job d'indexation est ajouté à `albumIndexQueue` après mise à jour.
 */
export const PATCH = route(
  {
    params: idParamSchema,
    body: updateAlbumBodySchema,
    permission: { resource: "album", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    const [album] = await db
      .update(albums)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(albums.id, params.id))
      .returning();
    if (!album) return fail("NOT_FOUND", "Album introuvable");

    await albumIndexQueue.add("index", { albumId: album.id, action: "index" });
    return ok(album);
  },
);

/**
 * DELETE /api/albums/:id — supprime un album.
 *
 * Réservé aux utilisateurs ayant la permission `album:delete`
 * (moderator et au-delà). La cascade DB supprime les pistes liées,
 * on collecte donc leurs ids AVANT la suppression pour pouvoir
 * désindexer chaque piste individuellement.
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @returns 200 avec `{ deleted: true }`, ou 404 si introuvable.
 * Des jobs de désindexation sont ajoutés pour l'album et chaque piste.
 */
export const DELETE = route(
  {
    params: idParamSchema,
    permission: { resource: "album", action: "delete" },
    rateLimit: { limit: 5, window: 60, failMode: "closed" },
  },
  async ({ params }) => {
    // Collecter la descendance AVANT suppression (cascade DB)
    const trackIds = await listTrackIdsByAlbumId(params.id);

    const [album] = await db
      .delete(albums)
      .where(eq(albums.id, params.id))
      .returning();
    if (!album) return fail("NOT_FOUND", "Album introuvable");

    await albumIndexQueue.add("delete", {
      albumId: params.id,
      action: "delete",
    });
    await Promise.all(
      trackIds.map((trackId) =>
        trackIndexQueue.add("delete", { trackId, action: "delete" }),
      ),
    );

    return ok({ deleted: true });
  },
);
