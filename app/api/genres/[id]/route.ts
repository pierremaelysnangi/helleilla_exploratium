import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { updateGenreSchema } from "@/lib/validations/genre";
import { db } from "@/db";
import { genres } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = route({ params: idParamSchema }, async ({ params }) => {
  const [genre] = await db
    .select()
    .from(genres)
    .where(eq(genres.id, params.id))
    .limit(1);
  if (!genre) return fail("NOT_FOUND", "Genre introuvable");
  return ok(genre);
});

export const PATCH = route(
  {
    params: idParamSchema,
    body: updateGenreSchema,
    permission: { resource: "genre", action: "update" },
  },
  async ({ params, body }) => {
    const [genre] = await db
      .update(genres)
      .set(body)
      .where(eq(genres.id, params.id))
      .returning();
    if (!genre) return fail("NOT_FOUND", "Genre introuvable");
    return ok(genre);
  },
);

export const DELETE = route(
  {
    params: idParamSchema,
    permission: { resource: "genre", action: "delete" },
  },
  async ({ params }) => {
    const [genre] = await db
      .delete(genres)
      .where(eq(genres.id, params.id))
      .returning();
    if (!genre) return fail("NOT_FOUND", "Genre introuvable");
    return ok({ deleted: true });
  },
);
