/**
 * @file Définition Drizzle de la table `tracks` (pistes audio).
 *
 * Chaque piste appartient à un album et possède une position unique
 * (disque + numéro). Un index trigram GIN permet la recherche plein texte
 * sur le titre.
 */

// Constructeurs de colonnes et d'index fournis par Drizzle pour PostgreSQL
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
// Permet d'écrire des expressions SQL brutes (ici pour l'index GIN)
import { sql } from "drizzle-orm";
// Table `albums` référencée par la clé étrangère `album_id`
import { albums } from "./albums";

/**
 * Table `tracks` : une piste musicale rattachée à un album.
 */
export const tracks = pgTable(
  "tracks",
  {
    /** Identifiant technique généré automatiquement. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Album parent ; suppression en cascade avec l'album. */
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    /** Titre de la piste. */
    title: text("title").notNull(),
    /** Numéro de la piste sur son disque (commence à 1). */
    trackNumber: integer("track_number").notNull(),
    /** Numéro du disque (1 par défaut, utile pour les doubles albums). */
    discNumber: integer("disc_number").notNull().default(1),
    /** Durée en millisecondes (nullable si inconnue). */
    durationMs: integer("duration_ms"),
    /** URL du fichier audio jouable dans le lecteur intégré. */
    audioUrl: text("audio_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Accélération des requêtes « pistes d'un album »
    index("tracks_album_idx").on(t.albumId),
    // Index trigram GIN pour la recherche floue sur le titre (extension pg_trgm)
    index("tracks_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
    // Position unique : un même numéro ne peut exister deux fois sur un disque d'un album
    uniqueIndex("tracks_album_position_uq").on(
      t.albumId,
      t.discNumber,
      t.trackNumber,
    ),
  ],
);
