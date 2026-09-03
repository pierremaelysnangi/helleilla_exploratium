/**
 * @file Définition Drizzle de la table `albums` et de son enum `album_type`.
 *
 * Chaque album appartient à un groupe (`bands`) et contient des métadonnées
 * (titre, type, date de sortie, pochette). Un index trigram GIN permet la
 * recherche plein texte sur le titre.
 */

// Constructeurs de colonnes et d'index fournis par Drizzle pour PostgreSQL
import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
// Permet d'écrire des expressions SQL brutes (ici pour les index GIN)
import { sql } from "drizzle-orm";
// Table `bands` référencée par la clé étrangère `band_id`
import { bands } from "./bands";
// Label éditeur de la sortie (nullable : autoproduction ou label inconnu)
import { labels } from "./labels";

/**
 * Énumération du type de sortie musicale :
 * album studio, EP, single, compilation, live ou démo.
 */
export const albumTypeEnum = pgEnum("album_type", [
  "album",
  "ep",
  "single",
  "compilation",
  "live",
  "demo",
  /**
   * Split : sortie partagée entre plusieurs groupes.
   *
   * Type à part entière et non un album studio. « Cromlech / Spectres
   * Over Gorgoroth » réunit Darkthrone et Isengard : le ranger parmi les
   * albums studio de Darkthrone attribue au groupe une œuvre qui n'est
   * pas la sienne seule.
   */
  "split",
]);

/**
 * Table `albums` : une sortie musicale (album/EP/single...) d'un groupe.
 */
export const albums = pgTable(
  "albums",
  {
    /** Identifiant technique généré automatiquement par PostgreSQL. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Groupe propriétaire de l'album ; suppression en cascade. */
    bandId: uuid("band_id")
      .notNull()
      .references(() => bands.id, { onDelete: "cascade" }),
    /** Titre complet de l'album. */
    title: text("title").notNull(),
    /** Identifiant lisible pour les URL ; unique au sein d'un même groupe. */
    slug: text("slug").notNull(),
    /** Nature de la sortie (album, ep, single...), « album » par défaut. */
    type: albumTypeEnum("type").notNull().default("album"),
    /** Date de sortie complète (nullable si inconnue). */
    releaseDate: date("release_date"),
    /** Année de sortie seule (pratique pour les filtres/tris). */
    releaseYear: integer("release_year"),
    /** URL de la pochette de l'album. */
    coverUrl: text("cover_url"),
    /**
     * Label ayant publié la sortie. Nullable et `set null` à la
     * suppression : perdre un label ne doit pas effacer les albums.
     */
    labelId: uuid("label_id").references(() => labels.id, {
      onDelete: "set null",
    }),
    /** Horodatage de création (fuseau horaire inclus). */
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Horodatage de dernière modification. */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Accélération des requêtes « albums d'un groupe »
    index("albums_band_idx").on(t.bandId),
    // Index trigram GIN pour la recherche floue sur le titre (extension pg_trgm)
    index("albums_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
    // Un slug d'album est unique à l'intérieur d'un groupe donné
    uniqueIndex("albums_band_slug_uq").on(t.bandId, t.slug),
    // Recherche « tous les albums d'un label »
    index("albums_label_idx").on(t.labelId),
  ],
);
