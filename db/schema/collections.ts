/**
 * @file Appréciations et listes personnelles des utilisateurs.
 *
 * Ces deux tables vivent dans la base CONTENU et sont indexées par
 * `user_id` (identifiant Better Auth, texte). Ce sont des données
 * personnelles au sens où elles décrivent les goûts d'une personne : elles
 * ne portent en revanche aucun identifiant direct (ni email ni nom), et
 * deviennent anonymes dès que le compte est supprimé — le même parti pris
 * que pour `contributions.submitted_by`.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { albums } from "./albums";

/**
 * Table `ratings` : note d'un utilisateur sur un album.
 *
 * Clé primaire composée `(user_id, album_id)` : une seule note par
 * personne et par album, modifiable. Sans cette contrainte, un même
 * compte pourrait fausser une moyenne en votant plusieurs fois.
 */
export const ratings = pgTable(
  "ratings",
  {
    /** Identifiant Better Auth du votant. */
    userId: text("user_id").notNull(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    /** Note de 1 à 5, bornée en base et pas seulement côté application. */
    score: integer("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.albumId] }),
    index("ratings_album_idx").on(t.albumId),
    // Garde-fou en base : une écriture hors application reste bornée
    check("ratings_score_range", sql`${t.score} BETWEEN 1 AND 5`),
  ],
);

/** Statut d'un album dans la liste personnelle d'un utilisateur. */
export const collectionStatusEnum = pgEnum("collection_status", [
  /** Possédé physiquement ou numériquement. */
  "owned",
  /** Souhaité (liste d'envies). */
  "wanted",
]);

/**
 * Table `user_albums` : collection et liste d'envies.
 *
 * Un album ne peut pas être simultanément « possédé » et « souhaité » :
 * la clé primaire composée impose une seule ligne par couple, le statut se
 * remplace.
 */
export const userAlbums = pgTable(
  "user_albums",
  {
    userId: text("user_id").notNull(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    status: collectionStatusEnum("status").notNull().default("owned"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.albumId] }),
    index("user_albums_user_idx").on(t.userId),
  ],
);
