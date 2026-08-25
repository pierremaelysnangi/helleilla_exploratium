/**
 * @file Déclarations des relations entre tables pour l'API relationnelle
 * de Drizzle (`db.query.*`).
 *
 * Ces définitions ne créent aucune contrainte en base : elles servent
 * uniquement à Drizzle pour construire les requêtes imbriquées
 * (ex. `db.query.bands.findFirst({ with: { albums: true } })`).
 */

// Constructeur de relations fourni par Drizzle
import { relations } from "drizzle-orm";
import { bands } from "./bands";
import { albums } from "./albums";
import { tracks } from "./tracks";
import { genres, bandGenres } from "./genres";

/**
 * Un groupe possède plusieurs albums et plusieurs entrées dans la table
 * de jonction `band_genres`.
 */
export const bandsRelations = relations(bands, ({ many }) => ({
  albums: many(albums),
  bandGenres: many(bandGenres),
}));

/**
 * Un album appartient à un seul groupe et contient plusieurs pistes.
 */
export const albumsRelations = relations(albums, ({ one, many }) => ({
  band: one(bands, { fields: [albums.bandId], references: [bands.id] }),
  tracks: many(tracks),
}));

/**
 * Une piste appartient à un seul album.
 */
export const tracksRelations = relations(tracks, ({ one }) => ({
  album: one(albums, { fields: [tracks.albumId], references: [albums.id] }),
}));

/**
 * Un genre peut être référencé par plusieurs entrées de la table de jonction.
 */
export const genresRelations = relations(genres, ({ many }) => ({
  bandGenres: many(bandGenres),
}));

/**
 * Une entrée de jonction pointe vers exactement un groupe et un genre,
 * permettant d'accéder aux objets complets depuis `bandGenres`.
 */
export const bandGenresRelations = relations(bandGenres, ({ one }) => ({
  band: one(bands, { fields: [bandGenres.bandId], references: [bands.id] }),
  genre: one(genres, { fields: [bandGenres.genreId], references: [genres.id] }),
}));
