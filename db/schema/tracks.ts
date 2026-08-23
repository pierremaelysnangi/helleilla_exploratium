import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { albums } from "./albums";

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    trackNumber: integer("track_number").notNull(),
    discNumber: integer("disc_number").notNull().default(1),
    durationMs: integer("duration_ms"),
    audioUrl: text("audio_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("tracks_album_idx").on(t.albumId),
    index("tracks_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
    uniqueIndex("tracks_album_position_uq").on(
      t.albumId,
      t.discNumber,
      t.trackNumber,
    ),
  ],
);
