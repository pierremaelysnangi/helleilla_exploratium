/**
 * @file Membres de groupes et formations.
 *
 * Modèle en trois tables, calqué sur la réalité : une PERSONNE peut jouer
 * dans plusieurs groupes et sur certains albums seulement.
 *
 * - `members`       : la personne (identité artistique publique) ;
 * - `band_members`  : son appartenance à un groupe, avec période et rôle ;
 * - `album_lineups` : sa participation à un album précis.
 *
 * Jusqu'ici ces données n'étaient pas persistées : elles étaient lues à la
 * volée depuis MusicBrainz, donc invisibles à la recherche et impossibles
 * à corriger localement. `musicbrainzId` conserve le lien vers la source.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { bands } from "./bands";
import { albums } from "./albums";

/**
 * Table `members` : une personne, indépendamment de ses groupes.
 */
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Nom ou pseudonyme de scène. */
    name: text("name").notNull(),
    /** Identifiant lisible pour les URL, unique globalement. */
    slug: text("slug").notNull().unique(),
    /** Note biographique rédigée localement. */
    bio: text("bio"),
    /** Identifiant MusicBrainz, s'il est connu (référence, pas une copie). */
    musicbrainzId: text("musicbrainz_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Rapprochement avec la source externe sans doublonner une personne
    uniqueIndex("members_musicbrainz_uq").on(t.musicbrainzId),
  ],
);

/**
 * Table `band_members` : appartenance d'une personne à un groupe.
 *
 * Une même personne peut réintégrer un groupe après l'avoir quitté : la
 * clé d'unicité inclut donc l'année d'arrivée, sinon la seconde période
 * serait rejetée comme un doublon.
 */
export const bandMembers = pgTable(
  "band_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bandId: uuid("band_id")
      .notNull()
      .references(() => bands.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    /** Instrument ou fonction (« guitare », « chant »…). */
    role: text("role"),
    /** Année d'arrivée dans le groupe. */
    joinedYear: integer("joined_year"),
    /** Année de départ ; null = membre actuel. */
    leftYear: integer("left_year"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("band_members_band_idx").on(t.bandId),
    index("band_members_member_idx").on(t.memberId),
    uniqueIndex("band_members_period_uq").on(
      t.bandId,
      t.memberId,
      t.joinedYear,
    ),
  ],
);

/**
 * Table `album_lineups` : qui a joué sur un album donné.
 *
 * Distincte de `band_members` : un musicien de session peut figurer sur un
 * album sans avoir jamais été membre, et un membre peut être absent d'un
 * album de son propre groupe.
 */
export const albumLineups = pgTable(
  "album_lineups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    /** Rôle tenu sur cet album précis. */
    role: text("role"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("album_lineups_album_idx").on(t.albumId),
    index("album_lineups_member_idx").on(t.memberId),
    uniqueIndex("album_lineups_uq").on(t.albumId, t.memberId, t.role),
  ],
);
