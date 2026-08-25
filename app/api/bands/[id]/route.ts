/**
 * Imports :
 * - `route` : wrapper standardisant les handlers d'API
 *   (validation, permissions, rate limiting, gestion d'erreurs).
 * - `ok` / `fail` : constructeurs de réponses JSON de succès / erreur.
 * - `idParamSchema` : schéma Zod validant que le paramètre `[id]` est un UUID.
 * - `updateBandBodySchema` : schéma Zod du corps PATCH pour un groupe.
 * - `db` + `bands` : client Drizzle ORM et table `bands`.
 * - `eq` : opérateur d'égalité SQL de Drizzle.
 * - `bandIndexQueue` : file BullMQ pour l'(dés)indexation dans le moteur de recherche.
 */
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateBandBodySchema } from "@/lib/validations/band";
import { db } from "@/db";
import { bands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bandIndexQueue } from "@/lib/queue/client";
// Réindexation sémantique après modification (échec non bloquant)
import {
  enqueueEmbeddings,
  buildBandEmbeddingText,
} from "@/lib/queue/jobs/generate-embeddings";

/**
 * GET /api/bands/:id — récupère un groupe par son identifiant, avec ses
 * genres associés (via la table de jonction `bandGenres`).
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @returns 200 avec `{ ...band, genres: [{id,name,slug}] }`,
 *   ou 404 NOT_FOUND si introuvable.
 * Limité à 60 requêtes par minute (endpoint public en lecture).
 */
export const GET = route(
  {
    params: idParamSchema,
    rateLimit: { limit: 60, window: 60 },
  },
  async ({ params }) => {
    // Lecture relationnelle Drizzle : band + jonction + genre complet
    const row = await db.query.bands.findFirst({
      where: eq(bands.id, params.id),
      with: { bandGenres: { with: { genre: true } } },
    });
    if (!row) return fail("NOT_FOUND", "Groupe introuvable");

    // Projection publique : on n'expose que l'essentiel du genre
    const { bandGenres: _junction, ...band } = row;
    const genres = row.bandGenres.map((jg) => ({
      id: jg.genre.id,
      name: jg.genre.name,
      slug: jg.genre.slug,
    }));
    return ok({ ...band, genres });
  },
);

/**
 * PATCH /api/bands/:id — met à jour partiellement un groupe.
 *
 * Réservé aux utilisateurs ayant la permission `band:update`
 * (contributor et au-delà). Rate limit strict (10/min, failMode "closed").
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @param body - Corps de requête validé par `updateBandBodySchema`.
 * @returns 200 avec le groupe mis à jour, ou 404 si introuvable.
 * Un job de réindexation est ajouté après la mise à jour réussie.
 */
export const PATCH = route(
  {
    params: idParamSchema,
    body: updateBandBodySchema,
    permission: { resource: "band", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    const [band] = await db
      .update(bands)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(bands.id, params.id))
      .returning();
    if (!band) return fail("NOT_FOUND", "Groupe introuvable");

    await bandIndexQueue.add("index", { bandId: band.id, action: "index" });
    // Embedding sémantique : planifié après la réindexation plein-texte
    await enqueueEmbeddings(band.id, buildBandEmbeddingText(band));
    return ok(band);
  },
);

/**
 * DELETE /api/bands/:id — supprime un groupe.
 *
 * Réservé aux utilisateurs ayant la permission `band:delete`
 * (moderator et au-delà). La cascade DB s'occupe des entités liées.
 *
 * @param params - Paramètres de route validés (`id` UUID).
 * @returns 200 avec `{ deleted: true }`, ou 404 si introuvable.
 * Un job de désindexation est ajouté après suppression réussie.
 */
export const DELETE = route(
  {
    params: idParamSchema,
    permission: { resource: "band", action: "delete" },
    rateLimit: { limit: 5, window: 60, failMode: "closed" },
  },
  async ({ params }) => {
    const [band] = await db
      .delete(bands)
      .where(eq(bands.id, params.id))
      .returning();
    if (!band) return fail("NOT_FOUND", "Groupe introuvable");

    await bandIndexQueue.add("delete", { bandId: params.id, action: "delete" });
    return ok({ deleted: true });
  },
);
