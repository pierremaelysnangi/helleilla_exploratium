/**
 * @file Table `venues` — festivals et salles de la scène metal.
 *
 * Un festival et une salle de concert sont deux formes d'un même objet :
 * un lieu récurrent où la scène se retrouve, avec un pays, une ville, un
 * site officiel et une période d'existence. Les séparer en deux tables
 * aurait dupliqué la moitié des colonnes et imposé deux requêtes pour
 * afficher « ce qu'il y a en Norvège ».
 *
 * Donnée ÉDITORIALE, comme les thèmes des groupes : aucune API libre ne
 * recense les festivals metal. Elle est saisie par les contributeurs,
 * avec le lien officiel comme preuve.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Nature d'un lieu. */
export const venueKindEnum = pgEnum("venue_kind", [
  /** Festival, généralement annuel. */
  "festival",
  /** Salle ou club programmant régulièrement la scène. */
  "venue",
]);

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Identifiant lisible pour les URL, unique globalement. */
    slug: text("slug").notNull().unique(),
    kind: venueKindEnum("kind").notNull().default("festival"),
    /** Code pays ISO 3166-1 alpha-2, pour le regroupement par pays. */
    countryCode: text("country_code").notNull(),
    /** Ville ou commune d'accueil. */
    city: text("city"),
    /** Première édition, ou année d'ouverture. */
    foundedYear: integer("founded_year"),
    /**
     * Année de la dernière édition, si le lieu a cessé.
     *
     * `null` signifie « toujours en activité » — et non « inconnu » :
     * une édition annulée ne clôt pas un festival.
     */
    endedYear: integer("ended_year"),
    /** Site officiel : c'est lui qui fait foi, et qui sert de preuve. */
    websiteUrl: text("website_url"),
    /**
     * Capacité ou fréquentation annoncée.
     *
     * Ordre de grandeur seulement : les chiffres communiqués par les
     * organisateurs sont rarement vérifiables, et l'on n'en tire aucun
     * classement.
     */
    capacity: integer("capacity"),
    /** Présentation courte, rédigée par les contributeurs. */
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Regroupement par pays : c'est l'axe de lecture de la page
    index("venues_country_idx").on(t.countryCode),
    index("venues_kind_idx").on(t.kind),
    // Un même nom peut exister dans deux pays (« Metal Days ») : c'est le
    // couple qui doit être unique, pas le nom seul.
    uniqueIndex("venues_country_name_uq").on(t.countryCode, t.name),
  ],
);
