import { db } from '@/db';
import { genres } from '@/db/schema';
import { eq, ilike, isNull } from 'drizzle-orm';

export async function getGenreById(id: string) {
  const [genre] = await db
    .select()
    .from(genres)
    .where(eq(genres.id, id));
  return genre ?? null;
}

export async function getGenreBySlug(slug: string) {
  const [genre] = await db
    .select()
    .from(genres)
    .where(eq(genres.slug, slug));
  return genre ?? null;
}

export async function listGenres(limit = 100) {
  return db
    .select()
    .from(genres)
    .where(isNull(genres.parentId))
    .limit(limit);
}

export async function getSubgenres(parentId: string) {
  return db
    .select()
    .from(genres)
    .where(eq(genres.parentId, parentId));
}

export async function searchGenresByName(query: string) {
  return db
    .select()
    .from(genres)
    .where(ilike(genres.name, `%${query}%`))
    .limit(20);
}
