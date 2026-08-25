/**
 * @file Définitions Drizzle des tables `genres` et `band_genres`.
 *
 * Les genres forment une hiérarchie (auto-référence via `parentId`).
 * La table de jonction `band_genres` relie les groupes aux genres
 * (relation plusieurs-à-plusieurs).
 */

// Constructeurs de colonnes fournis par Drizzle pour PostgreSQL
import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
// Table `bands` référencée par la table de jonction
import { bands } from "./bands";

/**
 * Table `genres` : un genre musical, potentiellement sous-genre
 * d'un autre genre (hiérarchie auto-référentielle).
 */
export const genres = pgTable("genres", {
  /** Identifiant technique généré automatiquement. */
  id: uuid("id").primaryKey().defaultRandom(),
  /** Nom du genre, unique (ex. « Death Metal »). */
  name: text("name").notNull().unique(),
  /** Identifiant lisible pour les URL, unique. */
  slug: text("slug").notNull().unique(),
  /**
   * Genre parent (auto-référence). `AnyPgColumn` est requis pour casser
   * la circularité du typage TypeScript. Null pour un genre racine ;
   * le parent passe à null si le genre parent est supprimé.
   */
  parentId: uuid("parent_id").references((): AnyPgColumn => genres.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Table `band_genres` : jonction plusieurs-à-plusieurs entre groupes
 * et genres. La clé primaire composée empêche les doublons.
 */
export const bandGenres = pgTable(
  "band_genres",
  {
    /** Groupe concerné ; suppression en cascade. */
    bandId: uuid("band_id")
      .notNull()
      .references(() => bands.id, { onDelete: "cascade" }),
    /** Genre associé ; suppression en cascade. */
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (t) => [
    // Clé primaire composée : un même couple (groupe, genre) ne peut exister deux fois
    primaryKey({ columns: [t.bandId, t.genreId] }),
    // Accélération des requêtes « groupes d'un genre »
    index("band_genres_genre_idx").on(t.genreId),
  ],
);
