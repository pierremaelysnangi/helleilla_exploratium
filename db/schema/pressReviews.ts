/**
 * @file Table `press_reviews` — critiques de presse rattachées à un album.
 *
 * Pendant « professionnel » des notes d'auditeurs (`ratings`) : la page
 * d'un album montre les deux côte à côte, parce qu'elles ne disent pas la
 * même chose et qu'aucune ne prime sur l'autre.
 *
 * AUCUN texte de critique n'est reproduit : le contenu rédactionnel
 * appartient à ses auteurs et à leurs publications. On conserve la
 * publication, le nom du critique, la note ramenée sur 100 et le LIEN
 * vers l'article original — c'est-à-dire de quoi renvoyer le lecteur à
 * la source, jamais de quoi s'y substituer.
 *
 * Donnée éditoriale, comme les thèmes des groupes : aucune API libre ne
 * recense les critiques de presse metal. Elle est saisie par les
 * contributeurs, avec les mêmes exigences de preuve que le reste.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { albums } from "./albums";

export const pressReviews = pgTable(
  "press_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    /** Publication : « Decibel », « Metal Hammer », « Pitchfork »… */
    outlet: text("outlet").notNull(),
    /** Auteur de la critique, quand il est crédité. */
    author: text("author"),
    /**
     * Note ramenée sur 100.
     *
     * Les publications notent sur 5, sur 10, sur 100 ou avec des lettres :
     * une échelle commune est indispensable pour les afficher ensemble.
     * L'échelle d'origine reste consultable via le lien.
     */
    score: integer("score"),
    /** Lien vers l'article original — la seule source qui fait foi. */
    url: text("url").notNull(),
    /** Date de publication de la critique. */
    publishedAt: date("published_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("press_reviews_album_idx").on(t.albumId),
    // Une publication ne critique qu'une fois un album donné : sans cette
    // contrainte, un import rejoué dupliquerait chaque critique.
    uniqueIndex("press_reviews_album_outlet_uq").on(t.albumId, t.outlet),
    check("press_reviews_score_range", sql`${t.score} BETWEEN 0 AND 100`),
  ],
);
