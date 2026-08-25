/**
 * @file Profils publics (DB contenu).
 *
 * Cloisonnement RGPD : les données d'identité sensibles (email, mots de
 * passe, sessions) vivent dans une base DÉDIÉE (`AUTH_DATABASE_URL`,
 * voir lib/auth-db.ts). Cette table ne conserve qu'un profil public
 * minimal répliqué automatiquement par les hooks Better Auth
 * (databaseHooks.user.*) pour permettre les jointures locales.
 */

// Constructeurs de colonnes fournis par Drizzle pour PostgreSQL
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Table `profiles` : projection publique minimale d'un utilisateur.
 * La clé primaire est l'identifiant Better Auth (texte, généré par la
 * bibliothèque) — aucune donnée personnelle au-delà du nom affiché.
 */
export const profiles = pgTable("profiles", {
  /** Identifiant Better Auth (texte, pas un UUID applicatif). */
  userId: text("user_id").primaryKey(),
  /** Nom affiché publiquement (auteur d'une contribution, etc.). */
  displayName: text("display_name").notNull(),
  /** Rôle RBAC dénormalisé (user/contributor/moderator/admin). */
  role: text("role").notNull().default("user"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
