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
import { albums, bands } from "@/db/schema";
import { desc, asc, ilike, sql, and, eq, type SQL } from "drizzle-orm";
import { z } from "zod";
import { bandIdsByGenreSlug, restrictTo } from "@/db/queries/genreFilter";
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
 * Query de liste albums : pagination standard + filtre par groupe
 * (`bandId`, UUID) pour la discographie d'une page détail, et filtre
 * par `genre` (slug), hérité du groupe.
 */
const albumListQuerySchema = listQuerySchema.extend({
  bandId: z.string().uuid().optional(),
  /** Slug de genre : filtre sur le genre du groupe qui signe la sortie. */
  genre: z.string().trim().min(1).max(200).optional(),
});

/**
 * GET /api/albums — liste paginée d'albums avec recherche, tri et
 * filtre facultatif par groupe.
 *
 * @param query - Query params validés : pagination, filtre texte `q`,
 *   colonne de tri `sort`, sens `order` et `bandId`.
 * @returns 200 avec la page d'albums et les métadonnées de pagination.
 * Exécute en parallèle la requête de données et celle de comptage total.
 * Limité à 60 requêtes par minute.
 */
export const GET = route(
  { query: albumListQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { page, perPage, q, sort, order, bandId, genre } = query;
    const offset = (page - 1) * perPage;
    // Un album n'a pas de genre propre : il hérite de celui de son
    // groupe, comme partout ailleurs dans le catalogue.
    const genreIds = genre ? await bandIdsByGenreSlug(genre) : null;
    const where: SQL | undefined = and(
      q ? ilike(albums.title, `%${q}%`) : undefined,
      bandId ? eq(albums.bandId, bandId) : undefined,
      genreIds ? restrictTo(albums.bandId, genreIds) : undefined,
    );
    const dir = order === "asc" ? asc : desc;
    const column =
      SORT_COLUMNS[sort as keyof typeof SORT_COLUMNS] ?? albums.createdAt;

    const [items, counts] = await Promise.all([
      // Le groupe est joint à la ligne : l'URL canonique d'un album est
      // band-scopée, un client ne peut donc pas la construire sans lui.
      db
        .select({
          id: albums.id,
          bandId: albums.bandId,
          title: albums.title,
          slug: albums.slug,
          type: albums.type,
          releaseYear: albums.releaseYear,
          releaseDate: albums.releaseDate,
          coverUrl: albums.coverUrl,
          createdAt: albums.createdAt,
          updatedAt: albums.updatedAt,
          band: {
            id: bands.id,
            name: bands.name,
            slug: bands.slug,
            // Repli de pochette : voir `bandSummarySchema`
            imageUrl: bands.imageUrl,
          },
        })
        .from(albums)
        .innerJoin(bands, eq(bands.id, albums.bandId))
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
