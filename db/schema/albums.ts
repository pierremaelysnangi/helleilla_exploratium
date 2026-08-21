import {
  pgTable, uuid, text, integer, date, timestamp, index, uniqueIndex, pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { bands } from './bands';

export const albumTypeEnum = pgEnum('album_type', [
  'album', 'ep', 'single', 'compilation', 'live', 'demo',
]);

export const albums = pgTable('albums', {
  id: uuid('id').primaryKey().defaultRandom(),
  bandId: uuid('band_id').notNull()
    .references(() => bands.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  type: albumTypeEnum('type').notNull().default('album'),
  releaseDate: date('release_date'),
  releaseYear: integer('release_year'),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('albums_band_idx').on(t.bandId),
  index('albums_title_trgm_idx').using('gin', sql`${t.title} gin_trgm_ops`),
  uniqueIndex('albums_band_slug_uq').on(t.bandId, t.slug),
]);