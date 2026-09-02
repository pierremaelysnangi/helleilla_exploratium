/**
 * @file Contributions modérées : soumission de nouveaux groupes (et de
 * leurs médias) par les contributeurs, validation par les modérateurs.
 *
 * Cycle de vie :
 *   pending -> evidence_requested <-> (preuves fournies) -> approved
 *   evidence_requested --(2 relances sans réponse / 30 jours, job BullMQ)
 *                      -> expired
 *   Seul un admin peut poser un rejet terminal manuel (`rejected`).
 *
 * Les médias transitent par MinIO en préfixe privé
 * `staging/contributions/{id}/` puis sont promus vers `bands/{id}/`
 * à l'approbation (voir `lib/storage/contributions.ts`).
 */

// Constructeurs de colonnes fournis par Drizzle pour PostgreSQL
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/** Types de contribution pris en charge. */
export const contributionTypeEnum = pgEnum("contribution_type", [
  /** Création complète d'un nouveau groupe. */
  "band_create",
  /** Enrichissement d'un groupe existant (bio, médias…). */
  "band_update",
]);

/**
 * Statuts du workflow de médiation :
 * - pending : soumis, en attente de relecture ;
 * - evidence_requested : le modérateur demande des preuves
 *   supplémentaires (boucle avec le contributeur, jamais un rejet sec) ;
 * - approved : validé — médias promus et groupe créé/enrichi ;
 * - expired : aucune preuve fournie après 2 relances / 30 jours ;
 * - rejected : rejet terminal, décision manuelle d'admin uniquement.
 */
export const contributionStatusEnum = pgEnum("contribution_status", [
  "pending",
  "evidence_requested",
  "approved",
  "expired",
  "rejected",
]);

/**
 * Table `contributions` : dossier de soumission complet. Le payload
 * JSONB porte les champs du groupe (name, slug, bio, pays, années…) ;
 * les preuves sont des objets typés { kind, url, note }.
 */
export const contributions = pgTable(
  "contributions",
  {
    /** Identifiant technique généré automatiquement. */
    id: uuid("id").primaryKey().defaultRandom(),
    /** Nature de la contribution. */
    type: contributionTypeEnum("type").notNull(),
    /** Statut courant dans le workflow de médiation. */
    status: contributionStatusEnum("status").notNull().default("pending"),
    /** Données métier du groupe soumises (schéma validé côté API). */
    payload: jsonb("payload").notNull(),
    /**
     * Preuves fournies : [{ kind: "official-site"|"label"|"press"|
     * "musicbrainz"|"discogs"|"other", url, note? }].
     */
    evidence: jsonb("evidence").notNull().default([]),
    /**
     * Note du modérateur expliquant la demande de preuves ; vidée à
     * chaque nouvelle soumission du contributeur.
     */
    reviewNotes: text("review_notes"),
    /**
     * Contributeur ayant soumis — identifiant Better Auth (texte),
     * référencant profiles.user_id de la DB contenu.
     */
    submittedBy: text("submitted_by").notNull(),
    /** Modérateur ayant traité la dernière relecture, si applicable. */
    reviewedBy: text("reviewed_by"),
    /** Nombre de relances « preuves » envoyées au contributeur. */
    reminderCount: integer("reminder_count").notNull().default(0),
    /** Échéance au-delà de laquelle le job d'expiration clôture. */
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // File de travail des modérateurs : statuts ouverts d'abord
    index("contributions_status_idx").on(t.status),
    // Mes contributions : espace contributeur
    index("contributions_submitted_by_idx").on(t.submittedBy),
    // Balayage du job d'expiration par échéance
    index("contributions_deadline_idx").on(t.deadlineAt),
  ],
);
