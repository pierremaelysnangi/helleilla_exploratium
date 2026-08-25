/**
 * Imports :
 * - `route` : wrapper standardisant les handlers d'API
 *   (validation, permissions, rate limiting, gestion d'erreurs).
 * - `ok` / `okPaginated` : réponses JSON de succès, simple ou paginée.
 * - `listQuerySchema` : schéma Zod des query params de liste
 *   (page, perPage, recherche `q`, tri `sort`, ordre `order`).
 * - `createBandSchema` : schéma Zod du corps POST de création de groupe.
 * - `db` + `bands` : client Drizzle ORM et table `bands`.
 * - Opérateurs Drizzle (`desc`, `asc`, `ilike`, `sql`) et type `SQL`
 *   pour construire tri, filtre et comptage.
 * - `bandIndexQueue` : file BullMQ pour l'indexation dans le moteur de recherche.
 */
import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { listQuerySchema } from "@/lib/api/schemas";
import { createBandSchema } from "@/lib/validations/band";
import { db } from "@/db";
import { bands } from "@/db/schema";
import { desc, asc, ilike, sql, type SQL } from "drizzle-orm";
import { bandIndexQueue } from "@/lib/queue/client";
// Génération d'embedding sémantique (non bloquante)
import {
  enqueueEmbeddings,
  buildBandEmbeddingText,
} from "@/lib/queue/jobs/generate-embeddings";

/**
 * Correspondance entre les valeurs du paramètre `sort` acceptées par l'API
 * et les colonnes SQL réelles de la table `bands`. Fallback sur `createdAt`.
 */
const SORT_COLUMNS = {
  name: bands.name,
  createdAt: bands.createdAt,
  year: bands.formedYear,
} as const;

/**
 * GET /api/bands — liste paginée de groupes avec recherche et tri.
 *
 * @param query - Query params validés : pagination, filtre texte `q`,
 *   colonne de tri `sort` et sens `order`.
 * @returns 200 avec la page de groupes et les métadonnées de pagination.
 * Exécute en parallèle la requête de données et celle de comptage total.
 * Limité à 60 requêtes par minute.
 */
export const GET = route(
  { query: listQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { page, perPage, q, sort, order } = query;
    const offset = (page - 1) * perPage;
    const where: SQL | undefined = q ? ilike(bands.name, `%${q}%`) : undefined;
    const dir = order === "asc" ? asc : desc;
    const column =
      SORT_COLUMNS[sort as keyof typeof SORT_COLUMNS] ?? bands.createdAt;

    const [items, counts] = await Promise.all([
      db
        .select()
        .from(bands)
        .where(where)
        .orderBy(dir(column))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bands)
        .where(where),
    ]);

    return okPaginated(items, counts[0]?.count ?? 0, page, perPage);
  },
);

/**
 * POST /api/bands — crée un nouveau groupe.
 *
 * Réservé aux utilisateurs ayant la permission `band:create`
 * (contributor et au-delà). Rate limit strict (10/min, failMode "closed").
 *
 * @param body - Corps de requête validé par `createBandSchema`.
 * @returns 201 avec le groupe créé ; un job d'indexation est ajouté
 *   à `bandIndexQueue` pour le rendre recherchable.
 */
export const POST = route(
  {
    body: createBandSchema,
    permission: { resource: "band", action: "create" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body }) => {
    const [band] = await db.insert(bands).values(body).returning();
    await bandIndexQueue.add("index", { bandId: band.id, action: "index" });
    // Embedding sémantique : planifié après l'indexation, échec non bloquant
    await enqueueEmbeddings(band.id, buildBandEmbeddingText(band));
    return ok(band, { status: 201 });
  },
);
