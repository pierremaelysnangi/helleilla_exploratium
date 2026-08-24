import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { searchQuerySchema } from "@/lib/api/schemas";
import { createTrackSchema } from "@/lib/validations/track";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { desc, asc, ilike, sql, type SQL } from "drizzle-orm";
import { trackIndexQueue } from "@/lib/queue/client";

const SORT_COLUMNS = {
  name: tracks.title,
  createdAt: tracks.createdAt,
  trackNumber: tracks.trackNumber,
} as const;

export const GET = route(
  { query: searchQuerySchema, rateLimit: { limit: 60, window: 60 } },
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
