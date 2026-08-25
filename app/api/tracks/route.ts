/**
 * Imports :
 * - `route` : wrapper standardisant les handlers d'API
 *   (validation, permissions, rate limiting, gestion d'erreurs).
 * - `ok` / `okPaginated` : réponses JSON de succès, simple ou paginée.
 * - `listQuerySchema` : schéma Zod des query params de liste
 *   (page, perPage, recherche `q`, tri `sort`, ordre `order`).
 * - `createTrackSchema` : schéma Zod du corps POST de création de piste.
 * - `db` + `tracks` : client Drizzle ORM et table `tracks`.
 * - Opérateurs Drizzle (`desc`, `asc`, `ilike`, `sql`) et type `SQL`
 *   pour construire tri, filtre et comptage.
 * - `trackIndexQueue` : file BullMQ pour l'indexation dans le moteur de recherche.
 */
import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { listQuerySchema } from "@/lib/api/schemas";
import { createTrackSchema } from "@/lib/validations/track";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { desc, asc, ilike, sql, type SQL } from "drizzle-orm";
import { trackIndexQueue } from "@/lib/queue/client";

/**
 * Correspondance entre les valeurs du paramètre `sort` acceptées par l'API
 * et les colonnes SQL réelles de la table `tracks`. Fallback sur `createdAt`.
 */
const SORT_COLUMNS = {
  name: tracks.title,
  createdAt: tracks.createdAt,
  trackNumber: tracks.trackNumber,
} as const;

/**
 * GET /api/tracks — liste paginée de pistes avec recherche et tri.
 *
 * @param query - Query params validés : pagination, filtre texte `q`,
 *   colonne de tri `sort` et sens `order`.
 * @returns 200 avec la page de pistes et les métadonnées de pagination.
 * Exécute en parallèle la requête de données et celle de comptage total.
 * Limité à 60 requêtes par minute.
 */
export const GET = route(
  { query: listQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { page, perPage, q, sort, order } = query;
    const offset = (page - 1) * perPage;
    const where: SQL | undefined = q
      ? ilike(tracks.title, `%${q}%`)
      : undefined;
    const dir = order === "asc" ? asc : desc;
    const column =
      SORT_COLUMNS[sort as keyof typeof SORT_COLUMNS] ?? tracks.createdAt;

    const [items, counts] = await Promise.all([
      db
        .select()
        .from(tracks)
        .where(where)
        .orderBy(dir(column))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tracks)
        .where(where),
    ]);

    return okPaginated(items, counts[0]?.count ?? 0, page, perPage);
  },
);

/**
 * POST /api/tracks — crée une nouvelle piste.
 *
 * Réservé aux utilisateurs ayant la permission `track:create`
 * (contributor et au-delà). Rate limit strict (10/min, failMode "closed").
 *
 * @param body - Corps de requête validé par `createTrackSchema`.
 * @returns 201 avec la piste créée ; un job d'indexation est ajouté
 *   à `trackIndexQueue` pour la rendre recherchable.
 */
export const POST = route(
  {
    body: createTrackSchema,
    permission: { resource: "track", action: "create" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body }) => {
    const [track] = await db.insert(tracks).values(body).returning();
    await trackIndexQueue.add("index", { trackId: track.id, action: "index" });
    return ok(track, { status: 201 });
  },
);
