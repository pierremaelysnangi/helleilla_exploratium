import { db } from "@/db";
import { genres } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createGenre(data: typeof genres.$inferInsert) {
  const [genre] = await db.insert(genres).values(data).returning();
  return genre;
}

export async function updateGenre(
  id: string,
  data: Partial<typeof genres.$inferInsert>,
) {
  const [genre] = await db
    .update(genres)
    .set(data)
    .where(eq(genres.id, id))
    .returning();
  return genre;
}

export async function deleteGenre(id: string) {
  await db.delete(genres).where(eq(genres.id, id));
}
