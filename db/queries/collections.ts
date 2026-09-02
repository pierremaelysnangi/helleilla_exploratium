/**
 * @file Requêtes sur les notes et les listes personnelles.
 *
 * Les agrégats (moyenne, nombre de votes) sont calculés en SQL : les
 * remonter en mémoire pour les moyenner en JavaScript ne passerait pas
 * l'échelle et donnerait des résultats incohérents entre deux pages.
 */

import { db } from "@/db";
import { ratings, userAlbums, albums, bands } from "@/db/schema";
import { and, avg, count, desc, eq } from "drizzle-orm";

/** Agrégat public des notes d'un album. */
export type RatingSummary = {
  /** Moyenne sur 5, arrondie au dixième ; null si aucun vote. */
  average: number | null;
  count: number;
};

/**
 * Moyenne et nombre de notes d'un album.
 */
export async function getRatingSummary(
  albumId: string,
): Promise<RatingSummary> {
  const [row] = await db
    .select({ average: avg(ratings.score), value: count() })
    .from(ratings)
    .where(eq(ratings.albumId, albumId));

  const raw = row?.average;
  return {
    // `avg()` renvoie une chaîne en PostgreSQL (numeric)
    average:
      raw === null || raw === undefined
        ? null
        : Math.round(Number(raw) * 10) / 10,
    count: row?.value ?? 0,
  };
}

/** Note donnée par un utilisateur à un album, ou null. */
export async function getUserRating(
  userId: string,
  albumId: string,
): Promise<number | null> {
  const [row] = await db
    .select({ score: ratings.score })
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.albumId, albumId)))
    .limit(1);
  return row?.score ?? null;
}

/**
 * Liste personnelle d'un utilisateur, jointe aux albums et à leur groupe
 * (le lien canonique d'un album exige le slug du groupe).
 *
 * @param status - Filtre « possédé » ou « souhaité » ; sans valeur, tout.
 */
export async function listUserAlbums(
  userId: string,
  status?: "owned" | "wanted",
) {
  const where = status
    ? and(eq(userAlbums.userId, userId), eq(userAlbums.status, status))
    : eq(userAlbums.userId, userId);

  return db
    .select({
      albumId: albums.id,
      title: albums.title,
      slug: albums.slug,
      type: albums.type,
      releaseYear: albums.releaseYear,
      coverUrl: albums.coverUrl,
      bandName: bands.name,
      bandSlug: bands.slug,
      status: userAlbums.status,
      addedAt: userAlbums.createdAt,
    })
    .from(userAlbums)
    .innerJoin(albums, eq(userAlbums.albumId, albums.id))
    .innerJoin(bands, eq(albums.bandId, bands.id))
    .where(where)
    .orderBy(desc(userAlbums.createdAt));
}
