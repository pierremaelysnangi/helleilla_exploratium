import {
  pgTable, uuid, text, integer, timestamp, index, vector,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const bands = pgTable('bands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  bio: text('bio'),
  countryCode: text('country_code'),        // ISO 3166-1 alpha-2
  formedYear: integer('formed_year'),
  dissolvedYear: integer('dissolved_year'),
  imageUrl: text('image_url'),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('bands_name_trgm_idx').using('gin', sql`${t.name} gin_trgm_ops`),
  index('bands_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
]);