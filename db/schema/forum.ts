/**
 * @file Table `forum_posts` — avis publiés sur un groupe ou un album.
 *
 * Complète, sans les remplacer, les deux formes d'appréciation qui
 * existaient déjà :
 *
 * - `ratings` porte une note de 1 à 5 et rien d'autre. Elle dit
 *   COMBIEN, jamais POURQUOI ;
 * - `press_reviews` renvoie à un article extérieur, dont le texte
 *   appartient à sa publication et n'est pas reproduit ici.
 *
 * Un avis de forum est le seul texte que le site héberge lui-même. Il
 * est donc écrit par une personne identifiée par son compte, rattaché à
 * un sujet précis, et supprimable — par son auteur comme par la
 * modération.
 *
 * Le SUJET est soit un groupe, soit un album, jamais les deux ni aucun.
 * Deux colonnes distinctes plutôt qu'un couple (type, id) générique :
 * les clés étrangères font alors leur travail, et un album supprimé
 * emporte sa discussion au lieu de laisser des messages orphelins.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { bands } from "./bands";
import { albums } from "./albums";

/** Longueur minimale d'un avis : en deçà, ce n'est pas une opinion. */
export const FORUM_POST_MIN_LENGTH = 10;
/** Longueur maximale, alignée sur la contrainte en base. */
export const FORUM_POST_MAX_LENGTH = 4000;

export const forumPosts = pgTable(
  "forum_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Groupe discuté, ou `null` si l'avis porte sur un album. */
    bandId: uuid("band_id").references(() => bands.id, {
      onDelete: "cascade",
    }),
    /** Album discuté, ou `null` si l'avis porte sur un groupe. */
    albumId: uuid("album_id").references(() => albums.id, {
      onDelete: "cascade",
    }),
    /**
     * Identifiant Better Auth de l'auteur.
     *
     * Pas de clé étrangère : la base identité est séparée au titre du
     * cloisonnement RGPD. Le nom affiché se lit par jointure sur
     * `profiles`, comme pour les contributions.
     */
    userId: text("user_id").notNull(),
    /** Texte de l'avis, tel qu'écrit. */
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("forum_posts_band_idx").on(t.bandId),
    index("forum_posts_album_idx").on(t.albumId),
    // Le fil d'actualité lit toujours par date décroissante : sans cet
    // index, chaque affichage de l'accueil trie la table entière.
    index("forum_posts_recent_idx").on(t.createdAt.desc()),
    index("forum_posts_user_idx").on(t.userId),
    // Exactement un sujet. `num_nonnulls` compte les colonnes
    // renseignées : la contrainte interdit aussi bien l'avis sans sujet
    // que celui qui prétendrait porter sur les deux.
    check(
      "forum_posts_one_subject",
      sql`num_nonnulls(${t.bandId}, ${t.albumId}) = 1`,
    ),
    // Bornes en base et pas seulement côté application : une écriture
    // qui passerait ailleurs reste tenue par la même règle.
    check(
      "forum_posts_body_length",
      sql`char_length(${t.body}) BETWEEN ${sql.raw(String(FORUM_POST_MIN_LENGTH))} AND ${sql.raw(String(FORUM_POST_MAX_LENGTH))}`,
    ),
  ],
);
