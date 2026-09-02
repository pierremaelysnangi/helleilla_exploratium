/**
 * Routes /api/labels — maisons de disques.
 *
 * Entité de catalogue au même titre qu'un genre : lecture publique,
 * création réservée à `genre:create` (moderator+), la taxonomie éditoriale
 * relevant de la modération plutôt que de la contribution ouverte.
 */

import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { z } from "zod";
import { db } from "@/db";
import { labels } from "@/db/schema";
import { asc, count, ilike } from "drizzle-orm";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const listLabelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(200).optional(),
});

const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().toLowerCase().min(1).max(200).regex(slugRegex),
  countryCode: z.string().trim().toUpperCase().length(2).optional().nullable(),
  foundedYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  websiteUrl: z.string().url().max(500).optional().nullable(),
});

/** GET /api/labels — annuaire paginé des labels. */
export const GET = route(
  { query: listLabelsQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const where = query.q ? ilike(labels.name, `%${query.q}%`) : undefined;
    const [items, [totals]] = await Promise.all([
      db
        .select()
        .from(labels)
        .where(where)
        .orderBy(asc(labels.name))
        .limit(query.perPage)
        .offset((query.page - 1) * query.perPage),
      db.select({ value: count() }).from(labels).where(where),
    ]);
    return okPaginated(items, totals?.value ?? 0, query.page, query.perPage);
  },
);

/** POST /api/labels — crée un label (moderator+). */
export const POST = route(
  {
    body: createLabelSchema,
    permission: { resource: "genre", action: "create" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body }) => {
    const [row] = await db.insert(labels).values(body).returning();
    return ok(row, { status: 201 });
  },
);
