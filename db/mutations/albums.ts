import { db } from "@/db";
import { albums } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createAlbum(data: typeof albums.$inferInsert) {
  const [album] = await db.insert(albums).values(data).returning();
  return album;
}

export async function updateAlbum(
  id: string,
  data: Partial<typeof albums.$inferInsert>,
) {
  const [album] = await db
    .update(albums)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(albums.id, id))
    .returning();
  return album;
}

export async function deleteAlbum(id: string) {
  await db.delete(albums).where(eq(albums.id, id));
}
