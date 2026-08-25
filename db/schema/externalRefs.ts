/**
 * @file Références externes vers les plateformes tierces.
 *
 * La base ne stocke AUCUN média : uniquement des identifiants externes
 * (MusicBrainz, Discogs, Wikidata, Spotify, YouTube, Bandcamp, Qobuz,
 * Deezer). Les médias et informations sont résolus à la demande par les
 * providers (`lib/providers/`) via le resolver (`lib/media/resolver.ts`).
 *
 * Table polymorphe : une même structure couvre band/album/track — pas de
 * colonnes par plateforme, extensible sans migration.
 */

// Constructeurs de colonnes fournis par Drizzle pour PostgreSQL
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** Entités applicatives pouvant porter des références externes. */
export const externalEntityEnum = pgEnum("external_entity", [
  "band",
  "album",
  "track",
]);

/**
 * Plateformes externes référencées. Toute nouvelle plateforme est un
 * simple ajout d'enum + provider dans `lib/providers/index.ts`.
 */
export const externalProviderEnum = pgEnum("external_provider", [
  "musicbrainz",
  "discogs",
  "wikidata",
  "spotify",
  "youtube",
  "bandcamp",
  "qobuz",
  "deezer",
]);

/**
 * Table `external_refs` : association entité locale <-> identifiant
 * externe. L'unicité (entityType, provider, externalId) empêche qu'un
 * même compte externe soit rattaché deux fois ; l'unicité partielle
 * (entityType, entityId, provider) garantit au plus une référence par
 * plateforme et par entité.
 */
export const externalRefs = pgTable(
  "external_refs",
  {
    /** Identifiant technique généré automatiquement. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Type d'entité locale concernée (band, album ou track). */
    entityType: externalEntityEnum("entity_type").notNull(),
    /** UUID de l'entité locale (bands.id, albums.id…). */
    entityId: uuid("entity_id").notNull(),
    /** Plateforme externe. */
    provider: externalProviderEnum("provider").notNull(),
    /** Identifiant de la ressource chez la plateforme. */
    externalId: text("external_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Un même ID externe ne référence jamais deux entités locales
    uniqueIndex("external_refs_provider_external_idx").on(
      t.provider,
      t.externalId,
    ),
    // Au plus une référence par plateforme pour chaque entité
    uniqueIndex("external_refs_entity_provider_idx").on(
      t.entityType,
      t.entityId,
      t.provider,
    ),
    // Résolution inverse rapide : quelles entités pointent vers X ?
    index("external_refs_provider_idx").on(t.provider),
  ],
);
