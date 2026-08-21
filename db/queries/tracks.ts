import { db } from '@/db';
import { tracks } from '@/db/schema';
import { eq, ilike, desc } from 'drizzle-orm';

export async function getTrackById(id: string) {
  const [track] = await db
    .select()
    .from(tracks)
    .where(eq(tracks.id, id));
  return track ?? null;
}

export async function listTracksByAlbumId(albumId: string) {
  return db
    .select()
    .from(tracks)
    .where(eq(tracks.albumId, albumId))
    .orderBy(tracks.trackNumber);
}

export async function searchTracksByTitle(query: string) {
  return db
    .select()
    .from(tracks)
    .where(ilike(tracks.title, `%${query}%`))
    .limit(20);
}

export async function getTrackWithAlbum(id: string) {
  return db.query.tracks.findFirst({
    where: (tracks, { eq }) => eq(tracks.id, id),
    with: {
      album: {
        with: { band: true },
      },
    },
  });
}
