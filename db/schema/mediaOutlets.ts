/**
 * @file Table `media_outlets` — presse et médias de la scène.
 *
 * Pendant de `venues` pour ce qui s'écrit et se diffuse plutôt que pour
 * ce qui se joue. Même parti pris : on RECENSE et on renvoie, on ne
 * recopie rien. Aucun article, aucun extrait sonore, aucune vignette
 * n'est stocké ici — seulement de quoi trouver la source.
 *
 * Volontairement SANS description. Un webzine américain porte déjà son
 * nom, son type et son pays à l'écran : y ajouter « webzine américain »
 * redirait ce que l'insigne et le regroupement montrent, et il aurait
 * fallu traduire ce doublon en quinze langues.
 *
 * Pas d'année de fondation non plus : elle est mal documentée pour la
 * moitié de ces titres, et une date approximative dans une encyclopédie
 * vaut moins que pas de date du tout.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Nature du média.
 *
 * `magazine` désigne une publication d'abord imprimée, `webzine` une
 * publication née en ligne : la distinction reste pertinente pour le
 * lecteur, les deux n'ayant ni le même rythme ni le même format.
 */
export const mediaOutletKindEnum = pgEnum("media_outlet_kind", [
  "webzine",
  "magazine",
  "radio",
  "podcast",
  "video",
]);

export const mediaOutlets = pgTable(
  "media_outlets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    kind: mediaOutletKindEnum("kind").notNull().default("webzine"),
    /** Code pays ISO 3166-1 alpha-2, pour le regroupement par pays. */
    countryCode: text("country_code").notNull(),
    /** Adresse officielle : c'est elle qui fait foi, et la seule donnée utile. */
    websiteUrl: text("website_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("media_outlets_country_idx").on(t.countryCode),
    index("media_outlets_kind_idx").on(t.kind),
    // Un même nom peut exister dans deux pays (« Metal Hammer » paraît
    // au Royaume-Uni et en Allemagne, ce sont deux rédactions) : c'est
    // le couple qui doit être unique, pas le nom seul.
    uniqueIndex("media_outlets_country_name_uq").on(t.countryCode, t.name),
  ],
);
