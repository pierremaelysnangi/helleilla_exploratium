import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateAlbumBodySchema } from "@/lib/validations/album";
import { db } from "@/db";
import { albums } from "@/db/schema";
import { eq } from "drizzle-orm";
import { albumIndexQueue, trackIndexQueue } from "@/lib/queue/client";
import { listTrackIdsByAlbumId } from "@/db/queries/tracks";

export const GET = route({ params: idParamSchema }, async ({ params }) => {
  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.id, params.id))
    .limit(1);
  if (!album) return fail("NOT_FOUND", "Album introuvable");
  return ok(album);
});

export const PATCH = route(
  {
    params: idParamSchema,
    body: updateAlbumBodySchema,
    permission: { resource: "album", action: "update" },
  },
  async ({ params, body }) => {
    const [album] = await db
      .update(albums)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(albums.id, params.id))
      .returning();
    if (!album) return fail("NOT_FOUND", "Album introuvable");

    await albumIndexQueue.add("index", { albumId: album.id, action: "index" });
    return ok(album);
  },
);

export const DELETE = route(
  {
    params: idParamSchema,
    permission: { resource: "album", action: "delete" },
  },
  async ({ params }) => {
    // Collecter la descendance AVANT suppression (cascade DB)
    const trackIds = await listTrackIdsByAlbumId(params.id);

    const [album] = await db
      .delete(albums)
      .where(eq(albums.id, params.id))
      .returning();
    if (!album) return fail("NOT_FOUND", "Album introuvable");

    await albumIndexQueue.add("delete", {
      albumId: params.id,
      action: "delete",
    });
    await Promise.all(
      trackIds.map((trackId) =>
        trackIndexQueue.add("delete", { trackId, action: "delete" }),
      ),
    );

    return ok({ deleted: true });
  },
);
