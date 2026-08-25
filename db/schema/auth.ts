/**
 * @file Schéma d'authentification (compatible Better Auth).
 *
 * Définit les tables `user`, `session`, `account` et `verification`,
 * plus un enum de rôles RBAC (`user`, `contributor`, `moderator`, `admin`)
 * et les champs d'administration (bannissement).
 * Les identifiants sont des `text` (et non des UUID) car ils sont générés
 * par la bibliothèque d'authentification.
 */

// Constructeurs de colonnes fournis par Drizzle pour PostgreSQL
import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// Les 4 rôles du RBAC
export const userRoleEnum = pgEnum("user_role", [
  "user",
  "contributor",
  "moderator",
  "admin",
]);

/**
 * Table `user` : comptes utilisateurs de l'application.
 */
export const user = pgTable("user", {
  /** Identifiant généré par la bibliothèque d'authentification. */
  id: text("id").primaryKey(),
  /** Nom affiché publiquement. */
  name: text("name").notNull(),
  /** Adresse e-mail, unique pour chaque compte. */
  email: text("email").notNull().unique(),
  /** Indique si l'e-mail a été vérifié. */
  emailVerified: boolean("email_verified").notNull().default(false),
  /** URL de l'avatar du compte. */
  image: text("image"),
  /** Émetteur OAuth (ex. « google ») si connexion via provider externe. */
  issuer: text("issuer"),

  // Champ custom : rôle RBAC
  role: userRoleEnum("role").notNull().default("user"),

  // Champs admin plugin (ban)
  /** Utilisateur banni ou non. */
  banned: boolean("banned").default(false),
  /** Motif du bannissement. */
  banReason: text("ban_reason"),
  /** Date d'expiration du ban (null = permanent). */
  banExpires: timestamp("ban_expires"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Table `session` : sessions actives d'un utilisateur (une ligne par connexion).
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  /** Date d'expiration de la session. */
  expiresAt: timestamp("expires_at").notNull(),
  /** Jeton de session unique transmis au client. */
  token: text("token").notNull().unique(),
  /** Adresse IP d'origine de la session. */
  ipAddress: text("ip_address"),
  /** User-Agent du navigateur ayant créé la session. */
  userAgent: text("user_agent"),
  /** Propriétaire de la session ; suppression en cascade avec le compte. */
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Identifiant de l'admin ayant usurpé cette session (impersonation). */
  impersonatedBy: text("impersonated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Table `account` : liaisons entre un utilisateur et ses providers
 * d'authentification (OAuth, credentials...), avec les jetons associés.
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  /** Identifiant du compte chez le provider externe. */
  accountId: text("account_id").notNull(),
  /** Nom du provider (google, github, credential...). */
  providerId: text("provider_id").notNull(),
  /** Utilisateur propriétaire ; suppression en cascade. */
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Émetteur OAuth associé au compte (requis par Better Auth >= 1.7). */
  issuer: text("issuer"),
  /** Jeton d'accès OAuth courant. */
  accessToken: text("access_token"),
  /** Jeton de renouvellement OAuth. */
  refreshToken: text("refresh_token"),
  /** Jeton d'identité OpenID Connect. */
  idToken: text("id_token"),
  /** Expiration du jeton d'accès. */
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  /** Expiration du jeton de renouvellement. */
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  /** Périmètre (scope) accordé au provider. */
  scope: text("scope"),
  /** Hash du mot de passe (uniquement pour le provider « credential »). */
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Table `verification` : jetons temporaires de vérification
 * (e-mail, réinitialisation de mot de passe...).
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  /** Cible de la vérification (généralement l'e-mail). */
  identifier: text("identifier").notNull(),
  /** Valeur du jeton de vérification. */
  value: text("value").notNull(),
  /** Date d'expiration du jeton. */
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
