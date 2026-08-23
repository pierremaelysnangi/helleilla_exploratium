import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createTrack(data: typeof tracks.$inferInsert) {
  const [track] = await db.insert(tracks).values(data).returning();
  return track;
}

export async function updateTrack(
  id: string,
  data: Partial<typeof tracks.$inferInsert>,
) {
  const [track] = await db
    .update(tracks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tracks.id, id))
    .returning();
  return track;
}

export async function deleteTrack(id: string) {
  await db.delete(tracks).where(eq(tracks.id, id));
}
