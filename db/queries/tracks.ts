import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq, ilike, inArray } from "drizzle-orm";

export async function getTrackById(id: string) {
  const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
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

export async function listTrackIdsByAlbumId(albumId: string) {
  const rows = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(eq(tracks.albumId, albumId));
  return rows.map((r) => r.id);
}

export async function listTrackIdsByAlbumIds(albumIds: string[]) {
  if (albumIds.length === 0) return [];
  const rows = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(inArray(tracks.albumId, albumIds));
  return rows.map((r) => r.id);
}
