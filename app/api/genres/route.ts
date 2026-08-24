import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/schemas";
import { createGenreSchema } from "@/lib/validations/genre";
import { db } from "@/db";
import { genres } from "@/db/schema";
import { asc, desc, ilike, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

const genreQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

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
