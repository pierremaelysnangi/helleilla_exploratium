/**
 * Imports :
 * - `route` : wrapper standardisant les handlers d'API
 *   (validation, permissions, rate limiting, gestion d'erreurs).
 * - `ok` / `okPaginated` : réponses JSON de succès, simple ou paginée.
 * - `paginationSchema` : schéma Zod de base pour la pagination
 *   (page / perPage), étendu ci-dessous.
 * - `createGenreSchema` : schéma Zod du corps POST de création de genre.
 * - `db` + `genres` : client Drizzle ORM et table `genres`.
 * - Opérateurs Drizzle (`asc`, `desc`, `ilike`, `sql`) et type `SQL`
 *   pour construire tri, filtre et comptage.
 * - `z` : constructeur de schémas Zod, utilisé pour l'extension ci-dessous.
 */
import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/schemas";
import { createGenreSchema } from "@/lib/validations/genre";
import { db } from "@/db";
import { genres } from "@/db/schema";
import { asc, desc, ilike, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

/**
 * Schéma des query params spécifique aux genres : pagination de base,
 * filtre texte optionnel `q` et tri par nom uniquement (asc par défaut).
 */
const genreQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET /api/genres — liste paginée de genres triés par nom.
 *
 * @param query - Query params validés par `genreQuerySchema`
 *   (pagination, filtre texte `q`, sens du tri `order`).
 * @returns 200 avec la page de genres et les métadonnées de pagination.
 * Exécute en parallèle la requête de données et celle de comptage total.
 * Limité à 60 requêtes par minute.
 */
export const GET = route(
  { query: genreQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { page, perPage, q, order } = query;
    const offset = (page - 1) * perPage;
    const where: SQL | undefined = q ? ilike(genres.name, `%${q}%`) : undefined;
    const dir = order === "asc" ? asc : desc;

    const [items, counts] = await Promise.all([
      db
        .select()
        .from(genres)
        .where(where)
        .orderBy(dir(genres.name))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(genres)
        .where(where),
    ]);

    return okPaginated(items, counts[0]?.count ?? 0, page, perPage);
  },
);

/**
 * POST /api/genres — crée un nouveau genre.
 *
 * Réservé aux utilisateurs ayant la permission `genre:create`
 * (RBAC durci : moderator et au-delà, pas les contributors).
 * Rate limit strict (10/min, failMode "closed").
 *
 * @param body - Corps de requête validé par `createGenreSchema`.
 * @returns 201 avec le genre créé.
 */
export const POST = route(
  {
    body: createGenreSchema,
    permission: { resource: "genre", action: "create" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body }) => {
    const [genre] = await db.insert(genres).values(body).returning();
    return ok(genre, { status: 201 });
  },
);
