/**
 * @file Lectures alimentant les widgets de la page d'accueil.
 *
 * Requêtes serveur directes : l'accueil est un Server Component, et
 * repasser par l'API n'ajouterait qu'un aller-retour HTTP pour des données
 * strictement publiques.
 *
 * Aucun de ces widgets n'invente de classement : « derniers ajouts » est
 * un tri par date, « mieux notés » s'appuie sur les votes réels et exclut
 * les albums sans note plutôt que de leur prêter une moyenne neutre.
 *
 * Les horodatages sont convertis en chaînes ISO avant d'être renvoyés :
 * <BandCard> et <AlbumCard> sont des composants clients typés sur la forme
 * SÉRIALISÉE de l'API. Leur passer des objets `Date` marcherait au runtime
 * mais ferait diverger le type de la réalité selon la provenance.
 */

import { db } from "@/db";
import { albums, bands, ratings } from "@/db/schema";
import { avg, count, desc, eq, gte, sql } from "drizzle-orm";

/** Derniers groupes ajoutés au catalogue. */
export async function listRecentBands(limit = 6) {
  const rows = await db
    .select({
      id: bands.id,
      name: bands.name,
      slug: bands.slug,
      bio: bands.bio,
      countryCode: bands.countryCode,
      formedYear: bands.formedYear,
      dissolvedYear: bands.dissolvedYear,
      imageUrl: bands.imageUrl,
      createdAt: bands.createdAt,
      updatedAt: bands.updatedAt,
    })
    .from(bands)
    .orderBy(desc(bands.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/** Dernières sorties ajoutées, avec le slug du groupe (lien canonique). */
export async function listRecentAlbums(limit = 8) {
  const rows = await db
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      type: albums.type,
      releaseYear: albums.releaseYear,
      coverUrl: albums.coverUrl,
      createdAt: albums.createdAt,
      updatedAt: albums.updatedAt,
      bandId: albums.bandId,
      bandSlug: bands.slug,
      bandName: bands.name,
    })
    .from(albums)
    .innerJoin(bands, eq(albums.bandId, bands.id))
    .orderBy(desc(albums.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/**
 * Albums les mieux notés.
 *
 * Un minimum de votes est exigé : sans ce seuil, un album noté 5 par une
 * seule personne coifferait un classique noté 4,6 par cinquante — un
 * classement statistiquement mensonger.
 */
export async function listTopRatedAlbums(limit = 6, minVotes = 3) {
  return db
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      coverUrl: albums.coverUrl,
      releaseYear: albums.releaseYear,
      bandSlug: bands.slug,
      bandName: bands.name,
      average: avg(ratings.score),
      votes: count(ratings.score),
    })
    .from(ratings)
    .innerJoin(albums, eq(ratings.albumId, albums.id))
    .innerJoin(bands, eq(albums.bandId, bands.id))
    .groupBy(albums.id, bands.slug, bands.name)
    .having(gte(count(ratings.score), minVotes))
    .orderBy(desc(sql`avg(${ratings.score})`))
    .limit(limit);
}
