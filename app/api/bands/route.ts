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
import { and, desc, asc, ilike, sql, type SQL } from "drizzle-orm";
// Filtre par genre, inclusif de ses sous-genres
import { bandIdsByGenreSlug, restrictTo } from "@/db/queries/genreFilter";
import { z } from "zod";
import { localeQuerySchema, localizeBand } from "@/lib/api/localize";
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
 * Query params de la liste : ceux de `listQuerySchema`, plus un filtre
 * facultatif par slug de genre.
 */
const bandListQuerySchema = listQuerySchema
  .extend({
    genre: z.string().trim().min(1).max(200).optional(),
  })
  // La langue demandée : elle décide de la biographie servie.
  .extend(localeQuerySchema.shape);

/**
 * GET /api/bands — liste paginée de groupes avec recherche, tri et
 * filtre facultatif par genre.
 *
 * @param query - Query params validés : pagination, filtre texte `q`,
 *   colonne de tri `sort`, sens `order` et slug de `genre`.
 * @returns 200 avec la page de groupes et les métadonnées de pagination.
 * Exécute en parallèle la requête de données et celle de comptage total.
 * Limité à 60 requêtes par minute.
 */
export const GET = route(
  { query: bandListQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { page, perPage, q, sort, order, genre, locale } = query;
    const offset = (page - 1) * perPage;
    // Le filtre par genre est résolu en amont : il traverse deux tables
    // de jointure, et l'exprimer en sous-requête rendrait le comptage
    // paginé difficile à lire pour un gain nul à cette volumétrie.
    const genreIds = genre ? await bandIdsByGenreSlug(genre) : null;
    const where: SQL | undefined = and(
      q ? ilike(bands.name, `%${q}%`) : undefined,
      genreIds ? restrictTo(bands.id, genreIds) : undefined,
    );
    const dir = order === "asc" ? asc : desc;
    const column =
      SORT_COLUMNS[sort as keyof typeof SORT_COLUMNS] ?? bands.createdAt;

    const [items, counts] = await Promise.all([
      db
        .select()
        .from(bands)
        .where(where)
        // `id` en dernier critère : sans départage stable, deux lignes
        // de même valeur de tri peuvent s'échanger d'une requête à
        // l'autre. En pagination LIMIT/OFFSET, la même ligne apparaît
        // alors sur deux pages — et une autre sur aucune. React signalait
        // le symptôme (« two children with the same key »), la cause est
        // ici.
        .orderBy(dir(column), asc(bands.id))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bands)
        .where(where),
    ]);

    return okPaginated(
      items.map((band) => localizeBand(band, locale)),
      counts[0]?.count ?? 0,
      page,
      perPage,
    );
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
