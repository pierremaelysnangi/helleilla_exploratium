/**
 * Imports :
 * - `route` : wrapper standardisant les handlers (validation, permissions, rate limit).
 * - `ok` / `okPaginated` : réponses JSON de succès, simple ou paginée avec métadonnées.
 * - `listQuerySchema` : schéma Zod des query params de liste
 *   (page, perPage, recherche `q`, tri `sort`, ordre `order`).
 * - `createAlbumSchema` : schéma Zod du corps POST de création d'album.
 * - `db` + `albums` : client Drizzle ORM et table `albums`.
 * - Opérateurs Drizzle (`desc`, `asc`, `ilike`, `sql`) et type `SQL`
 *   pour construire tri, filtre et comptage.
 * - `albumIndexQueue` : file BullMQ pour l'indexation dans le moteur de recherche.
 */
import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { listQuerySchema } from "@/lib/api/schemas";
import { createAlbumSchema } from "@/lib/validations/album";
import { db } from "@/db";
import { albums } from "@/db/schema";
import { desc, asc, ilike, sql, type SQL } from "drizzle-orm";
import { albumIndexQueue } from "@/lib/queue/client";

/**
 * Correspondance entre les valeurs du paramètre `sort` acceptées par l'API
 * et les colonnes SQL réelles de la table `albums`. Fallback sur `createdAt`.
 */
const SORT_COLUMNS = {
  name: albums.title,
  createdAt: albums.createdAt,
  year: albums.releaseYear,
} as const;

/**
 * GET /api/albums — liste paginée d'albums avec recherche et tri.
 *
 * @param query - Query params validés : pagination, filtre texte `q`,
 *   colonne de tri `sort` et sens `order`.
 * @returns 200 avec la page d'albums et les métadonnées de pagination.
 * Exécute en parallèle la requête de données et celle de comptage total.
 * Limité à 60 requêtes par minute.
 */
export const GET = route(
  { query: listQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { page, perPage, q, sort, order } = query;
    const offset = (page - 1) * perPage;
    const where: SQL | undefined = q
      ? ilike(albums.title, `%${q}%`)
      : undefined;
    const dir = order === "asc" ? asc : desc;
    const column =
      SORT_COLUMNS[sort as keyof typeof SORT_COLUMNS] ?? albums.createdAt;

    const [items, counts] = await Promise.all([
      db
        .select()
        .from(albums)
        .where(where)
        .orderBy(dir(column))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(albums)
        .where(where),
    ]);

    return okPaginated(items, counts[0]?.count ?? 0, page, perPage);
  },
);

/**
 * POST /api/albums — crée un nouvel album.
 *
 * Réservé aux utilisateurs ayant la permission `album:create`
 * (contributor et au-delà). Rate limit strict (10/min, failMode "closed").
 *
 * @param body - Corps de requête validé par `createAlbumSchema`.
 * @returns 201 avec l'album créé ; un job d'indexation est ajouté
 *   à `albumIndexQueue` pour le rendre recherchable.
 */
export const POST = route(
  {
    body: createAlbumSchema,
    permission: { resource: "album", action: "create" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body }) => {
    const [album] = await db.insert(albums).values(body).returning();
    await albumIndexQueue.add("index", { albumId: album.id, action: "index" });
    return ok(album, { status: 201 });
  },
);
