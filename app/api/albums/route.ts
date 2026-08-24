import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { searchQuerySchema } from "@/lib/api/schemas";
import { createAlbumSchema } from "@/lib/validations/album";
import { db } from "@/db";
import { albums } from "@/db/schema";
import { desc, asc, ilike, sql, type SQL } from "drizzle-orm";
import { albumIndexQueue } from "@/lib/queue/client";

const SORT_COLUMNS = {
  name: albums.title,
  createdAt: albums.createdAt,
  year: albums.releaseYear,
} as const;

export const GET = route({ query: searchQuerySchema }, async ({ query }) => {
  const { page, perPage, q, sort, order } = query;
  const offset = (page - 1) * perPage;
  const where: SQL | undefined = q ? ilike(albums.title, `%${q}%`) : undefined;
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
});

export const POST = route(
  {
    body: createAlbumSchema,
    permission: { resource: "album", action: "create" },
  },
  async ({ body }) => {
    const [album] = await db.insert(albums).values(body).returning();
    await albumIndexQueue.add("index", { albumId: album.id, action: "index" });
    return ok(album, { status: 201 });
  },
);
