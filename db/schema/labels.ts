/**
 * @file Labels (maisons de disques).
 *
 * Un album peut être publié par un label ; la relation est portée par
 * `albums.label_id` (nullable : beaucoup de sorties sont autoproduites,
 * et le label n'est pas toujours documenté).
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Table `labels` : maison de disques ou structure d'autoproduction.
 */
export const labels = pgTable(
  "labels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Identifiant lisible pour les URL, unique globalement. */
    slug: text("slug").notNull().unique(),
    /** Pays d'origine, ISO 3166-1 alpha-2. */
    countryCode: text("country_code"),
    foundedYear: integer("founded_year"),
    /** Site officiel — référence externe, jamais une copie de contenu. */
    websiteUrl: text("website_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("labels_name_idx").on(t.name)],
);
