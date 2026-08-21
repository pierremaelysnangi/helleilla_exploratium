import { pgTable, uuid, text, timestamp, primaryKey, index, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { bands } from './bands';

export const genres = pgTable('genres', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  parentId: uuid('parent_id')
    .references((): AnyPgColumn => genres.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bandGenres = pgTable('band_genres', {
  bandId: uuid('band_id').notNull()
    .references(() => bands.id, { onDelete: 'cascade' }),
  genreId: uuid('genre_id').notNull()
    .references(() => genres.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.bandId, t.genreId] }),
  index('band_genres_genre_idx').on(t.genreId),
]);