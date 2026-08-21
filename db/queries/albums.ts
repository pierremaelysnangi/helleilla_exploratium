import { db } from '@/db';
import { albums } from '@/db/schema';
import { eq, ilike, desc } from 'drizzle-orm';

export async function getAlbumById(id: string) {
  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.id, id));
  return album ?? null;
}

export async function getAlbumBySlug(slug: string) {
  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.slug, slug));
  return album ?? null;
}

export async function listAlbums(limit = 20) {
  return db
    .select()
    .from(albums)
    .orderBy(desc(albums.releaseDate))
    .limit(limit);
}

export async function listAlbumsByBandId(bandId: string) {
  return db
    .select()
    .from(albums)
    .where(eq(albums.bandId, bandId))
    .orderBy(desc(albums.releaseDate));
}

export async function searchAlbumsByTitle(query: string) {
  return db
    .select()
    .from(albums)
    .where(ilike(albums.title, `%${query}%`))
    .limit(20);
}

export async function getAlbumWithTracks(id: string) {
  return db.query.albums.findFirst({
    where: (albums, { eq }) => eq(albums.id, id),
    with: {
      band: true,
      tracks: true,
    },
  });
}
