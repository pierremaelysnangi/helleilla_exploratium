import { relations } from 'drizzle-orm';
import { bands } from './bands';
import { albums } from './albums';
import { tracks } from './tracks';
import { genres, bandGenres } from './genres';

export const bandsRelations = relations(bands, ({ many }) => ({
  albums: many(albums),
  bandGenres: many(bandGenres),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  band: one(bands, { fields: [albums.bandId], references: [bands.id] }),
  tracks: many(tracks),
}));

export const tracksRelations = relations(tracks, ({ one }) => ({
  album: one(albums, { fields: [tracks.albumId], references: [albums.id] }),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  bandGenres: many(bandGenres),
}));

export const bandGenresRelations = relations(bandGenres, ({ one }) => ({
  band: one(bands, { fields: [bandGenres.bandId], references: [bands.id] }),
  genre: one(genres, { fields: [bandGenres.genreId], references: [genres.id] }),
}));