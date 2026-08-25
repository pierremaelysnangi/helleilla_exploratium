/**
 * @file Définition Drizzle de la table `bands` (groupes musicaux).
 *
 * Contient les métadonnées d'un groupe (nom, biographie, pays, période
 * d'activité) ainsi qu'un vecteur d'embedding pour la recherche sémantique
 * (extension pgvector). Deux index avancés sont créés : trigram sur le nom
 * et HNSW cosine sur l'embedding.
 */

// Constructeurs de colonnes et d'index fournis par Drizzle pour PostgreSQL
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  vector,
} from "drizzle-orm/pg-core";
// Permet d'écrire des expressions SQL brutes (ici pour l'index GIN)
import { sql } from "drizzle-orm";

/**
 * Table `bands` : un groupe musical et ses métadonnées.
 */
export const bands = pgTable(
  "bands",
  {
    /** Identifiant technique généré automatiquement. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Nom du groupe, utilisé pour la recherche. */
    name: text("name").notNull(),
    /** Identifiant lisible pour les URL, unique à l'échelle globale. */
    slug: text("slug").notNull().unique(),
    /** Biographie du groupe (nullable). */
    bio: text("bio"),
    /** Code pays ISO 3166-1 alpha-2 (ex. « FR », « US »). */
    countryCode: text("country_code"), // ISO 3166-1 alpha-2
    /** Année de formation du groupe. */
    formedYear: integer("formed_year"),
    /** Année de séparation (null si le groupe est toujours actif). */
    dissolvedYear: integer("dissolved_year"),
    /** URL de l'image/photo du groupe. */
    imageUrl: text("image_url"),
    /**
     * Vecteur d'embedding (1536 dimensions, compatible OpenAI text-embedding)
     * destiné à la recherche sémantique via pgvector.
     */
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Index trigram GIN pour la recherche floue sur le nom (extension pg_trgm)
    index("bands_name_trgm_idx").using("gin", sql`${t.name} gin_trgm_ops`),
    // Index HNSW pour la recherche vectorielle par similarité cosinus
    index("bands_embedding_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  ],
);
