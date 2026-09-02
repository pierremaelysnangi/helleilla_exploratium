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
import { labels } from "./labels";
import { members, bandMembers, albumLineups } from "./members";
import { ratings, userAlbums } from "./collections";

/**
 * Un groupe possède plusieurs albums et plusieurs entrées dans la table
 * de jonction `band_genres`.
 */
export const bandsRelations = relations(bands, ({ many }) => ({
  albums: many(albums),
  bandGenres: many(bandGenres),
  bandMembers: many(bandMembers),
}));

/**
 * Un album appartient à un seul groupe et contient plusieurs pistes.
 */
export const albumsRelations = relations(albums, ({ one, many }) => ({
  band: one(bands, { fields: [albums.bandId], references: [bands.id] }),
  label: one(labels, { fields: [albums.labelId], references: [labels.id] }),
  tracks: many(tracks),
  lineup: many(albumLineups),
  ratings: many(ratings),
  userAlbums: many(userAlbums),
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

/**
 * Un label publie plusieurs albums.
 */
export const labelsRelations = relations(labels, ({ many }) => ({
  albums: many(albums),
}));

/**
 * Une personne appartient à des groupes et figure sur des albums.
 */
export const membersRelations = relations(members, ({ many }) => ({
  bandMembers: many(bandMembers),
  albumLineups: many(albumLineups),
}));

/**
 * Une appartenance relie exactement un groupe et une personne.
 */
export const bandMembersRelations = relations(bandMembers, ({ one }) => ({
  band: one(bands, { fields: [bandMembers.bandId], references: [bands.id] }),
  member: one(members, {
    fields: [bandMembers.memberId],
    references: [members.id],
  }),
}));

/**
 * Une ligne de formation relie exactement un album et une personne.
 */
export const albumLineupsRelations = relations(albumLineups, ({ one }) => ({
  album: one(albums, {
    fields: [albumLineups.albumId],
    references: [albums.id],
  }),
  member: one(members, {
    fields: [albumLineups.memberId],
    references: [members.id],
  }),
}));

/**
 * Une note porte sur un album (l'auteur vit dans la base identité).
 */
export const ratingsRelations = relations(ratings, ({ one }) => ({
  album: one(albums, { fields: [ratings.albumId], references: [albums.id] }),
}));

/**
 * Une entrée de collection porte sur un album.
 */
export const userAlbumsRelations = relations(userAlbums, ({ one }) => ({
  album: one(albums, { fields: [userAlbums.albumId], references: [albums.id] }),
}));
