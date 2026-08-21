import { db } from '@/db';
import { bands } from '@/db/schema';
import { eq, ilike, desc } from 'drizzle-orm';

export async function getBandById(id: string) {
  const [band] = await db
    .select()
    .from(bands)
    .where(eq(bands.id, id));
  return band ?? null;
}

export async function getBandBySlug(slug: string) {
  const [band] = await db
    .select()
    .from(bands)
    .where(eq(bands.slug, slug));
  return band ?? null;
}

export async function listBands(limit = 20) {
  return db
    .select()
    .from(bands)
    .orderBy(desc(bands.createdAt))
    .limit(limit);
}

export async function searchBandsByName(query: string) {
  return db
    .select()
    .from(bands)
    .where(ilike(bands.name, `%${query}%`))
    .limit(20);
}

export async function getBandWithAlbumsAndGenres(id: string) {
  return db.query.bands.findFirst({
    where: (bands, { eq }) => eq(bands.id, id),
    with: {
      albums: {
        with: { tracks: true },
      },
      bandGenres: {
        with: { genre: true },
      },
    },
  });
}
