import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateTrackBodySchema } from "@/lib/validations/track";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { trackIndexQueue } from "@/lib/queue/client";

export const GET = route({ params: idParamSchema }, async ({ params }) => {
  const [track] = await db
    .select()
    .from(tracks)
    .where(eq(tracks.id, params.id))
    .limit(1);
  if (!track) return fail("NOT_FOUND", "Piste introuvable");
  return ok(track);
});

export const PATCH = route(
  {
    params: idParamSchema,
    body: updateTrackBodySchema,
    permission: { resource: "track", action: "update" },
  },
  async ({ params, body }) => {
    const [track] = await db
      .update(tracks)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tracks.id, params.id))
      .returning();
    if (!track) return fail("NOT_FOUND", "Piste introuvable");

    await trackIndexQueue.add("index", { trackId: track.id, action: "index" });
    return ok(track);
  },
);

export const DELETE = route(
  {
    params: idParamSchema,
    permission: { resource: "track", action: "delete" },
  },
  async ({ params }) => {
    const [track] = await db
      .delete(tracks)
      .where(eq(tracks.id, params.id))
      .returning();
    if (!track) return fail("NOT_FOUND", "Piste introuvable");

    await trackIndexQueue.add("delete", {
      trackId: params.id,
      action: "delete",
    });
    return ok({ deleted: true });
  },
);
