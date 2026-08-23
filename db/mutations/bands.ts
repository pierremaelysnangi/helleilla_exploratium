import { db } from "@/db";
import { bands, bandGenres } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createBand(data: typeof bands.$inferInsert) {
  const [band] = await db.insert(bands).values(data).returning();
  return band;
}

export async function createBandWithGenres(
  bandData: typeof bands.$inferInsert,
  genreIds: string[],
) {
  return db.transaction(async (tx) => {
    const [band] = await tx.insert(bands).values(bandData).returning();

    if (genreIds.length > 0) {
      await tx
        .insert(bandGenres)
        .values(genreIds.map((genreId) => ({ bandId: band.id, genreId })));
    }

    return band;
  });
}

export async function updateBand(
  id: string,
  data: Partial<typeof bands.$inferInsert>,
) {
  const [band] = await db
    .update(bands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bands.id, id))
    .returning();
  return band;
}

export async function deleteBand(id: string) {
  await db.delete(bands).where(eq(bands.id, id));
}
