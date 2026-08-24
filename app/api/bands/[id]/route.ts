import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateBandBodySchema } from "@/lib/validations/band";
import { db } from "@/db";
import { bands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bandIndexQueue } from "@/lib/queue/client";

export const GET = route({ params: idParamSchema }, async ({ params }) => {
  const [band] = await db
    .select()
    .from(bands)
    .where(eq(bands.id, params.id))
    .limit(1);
  if (!band) return fail("NOT_FOUND", "Groupe introuvable");
  return ok(band);
});

export const PATCH = route(
  {
    params: idParamSchema,
    body: updateBandBodySchema,
    permission: { resource: "band", action: "update" },
  },
  async ({ params, body }) => {
    const [band] = await db
      .update(bands)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(bands.id, params.id))
      .returning();
    if (!band) return fail("NOT_FOUND", "Groupe introuvable");

    await bandIndexQueue.add("index", { bandId: band.id, action: "index" });
    return ok(band);
  },
);

export const DELETE = route(
  { params: idParamSchema, permission: { resource: "band", action: "delete" } },
  async ({ params }) => {
    const [band] = await db
      .delete(bands)
      .where(eq(bands.id, params.id))
      .returning();
    if (!band) return fail("NOT_FOUND", "Groupe introuvable");

    await bandIndexQueue.add("delete", { bandId: params.id, action: "delete" });
    return ok({ deleted: true });
  },
);
