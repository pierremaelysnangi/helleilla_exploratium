import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { searchQuerySchema } from "@/lib/api/schemas";
import { createBandSchema } from "@/lib/validations/band";
import { db } from "@/db";
import { bands } from "@/db/schema";
import { desc, asc, ilike, sql, type SQL } from "drizzle-orm";
import { bandIndexQueue } from "@/lib/queue/client";

const SORT_COLUMNS = {
  name: bands.name,
  createdAt: bands.createdAt,
  year: bands.formedYear,
} as const;

export const GET = route(
  { query: searchQuerySchema, rateLimit: { limit: 60, window: 60 } },
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

export const POST = route(
  {
    body: createBandSchema,
    permission: { resource: "band", action: "create" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body }) => {
    const [band] = await db.insert(bands).values(body).returning();
    await bandIndexQueue.add("index", { bandId: band.id, action: "index" });
    return ok(band, { status: 201 });
  },
);
