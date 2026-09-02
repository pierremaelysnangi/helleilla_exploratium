/**
 * Configuration serveur de Better Auth.
 * Définit l'instance d'authentification centrale de l'application :
 * - persistance des utilisateurs/sessions via Drizzle (PostgreSQL)
 * - hachage Argon2id des mots de passe
 * - stockage des sessions dans Redis (secondary storage)
 * - limitation de débit et plugin admin avec rôles.
 */

// Cœur de Better Auth côté serveur
import { betterAuth } from "better-auth";
// Adaptateur Drizzle pour persister les données d'authentification en PostgreSQL
import { drizzleAdapter } from "better-auth/adapters/drizzle";
// Plugin admin : gestion des rôles admin/utilisateur
import { admin } from "better-auth/plugins";
// Intégration Next.js : gestion des cookies dans les Server Actions / Route Handlers
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db"; // Instance Drizzle de la base CONTENU (profils publics)
import { closeDb } from "@/db"; // Fermeture du pool applicatif (teardown tests)
import { authDb } from "@/lib/auth-db"; // Instance Drizzle DÉDIÉE identité (RGPD)
import { closeAuthDb } from "@/lib/auth-db"; // Fermeture du pool identité (teardown tests)
// Tables d'identité : seules celles-ci vivent dans la base dédiée
import { user, session, account, verification } from "@/db/schema/auth";
import { profiles } from "@/db/schema/profiles";
import { env } from "@/lib/env"; // Variables d'environnement validées

// Comparaison SQL pour la mise à jour des profils
import { eq } from "drizzle-orm";
// Fonctions de hachage/vérification Argon2 (rapides et sécurisées)
import { hash, verify } from "@node-rs/argon2";
import { Redis } from "ioredis";

// Connexion Redis dédiée au stockage secondaire de Better Auth (sessions, rate limit)
const redis = new Redis(env.REDIS_URL);

/**
 * Instance Better Auth configurée pour toute l'application.
 * Exportée et utilisée par les handlers d'API, le middleware et le client auth.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET, // Secret de signature des sessions
  baseURL: env.BETTER_AUTH_URL, // URL de base pour les cookies/redirects

  // Persistance identité via Drizzle sur la base DÉDIÉE (cloisonnement
  // RGPD) : uniquement les tables user/session/account/verification.
  database: drizzleAdapter(authDb, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  /**
   * Réplication du profil public vers la base CONTENU : à chaque
   * création/modification d'utilisateur, la table `profiles` reçoit la
   * projection minimale (id, nom affiché, rôle) — aucune donnée sensible
   * (email, hash) ne quitte la base identité.
   */
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db
            .insert(profiles)
            .values({
              userId: user.id,
              displayName: user.name,
              role: (user.role as string | undefined) ?? "user",
            })
            .onConflictDoNothing();
        },
      },
      update: {
        after: async (user) => {
          await db
            .update(profiles)
            .set({
              displayName: user.name,
              role: (user.role as string | undefined) ?? "user",
              updatedAt: new Date(),
            })
            .where(eq(profiles.userId, user.id));
        },
      },
    },
  },

  // Authentification email + mot de passe (Argon2id, 12 caractères min.)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    requireEmailVerification: false,
    // Paramètres Argon2id conformes aux recommandations OWASP
    password: {
      hash: (password) =>
        hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      verify: ({ hash: h, password }) => verify(h, password),
    },

    // Envoi du lien de réinitialisation (SMTP optionnel : dégradation
    // journalisée en console, voir lib/auth/mail.ts)
    sendResetPassword: async ({ user, url }) => {
      const { sendResetPasswordEmail } = await import("@/lib/auth/mail");
      await sendResetPasswordEmail(user.email, url);
    },
  },

  // Limitation de débit globale + règles spécifiques plus strictes sur login/signup.
  // Désactivable via BETTER_AUTH_DISABLE_RATE_LIMIT=1 (tests E2E uniquement :
  // les suites multi-rôles dépassent les plafonds depuis l'IP de test).
  rateLimit: {
    enabled: process.env.BETTER_AUTH_DISABLE_RATE_LIMIT !== "1",
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": { window: 300, max: 5 },
      "/sign-up/email": { window: 3600, max: 3 },
      /**
       * Lecture de session : appelée à CHAQUE affichage de page par
       * l'en-tête. Le plafond global de 10/minute était donc atteint dès
       * qu'une personne parcourait une dizaine de pages en une minute —
       * ce qui n'a rien d'exceptionnel dans un catalogue — et l'en-tête
       * la présentait alors comme déconnectée.
       *
       * Ce n'est pas un point d'entrée sensible : il ne consomme aucun
       * secret et ne permet aucune énumération. Une limite haute y est
       * appropriée, là où connexion et inscription restent verrouillées.
       */
      "/get-session": { window: 60, max: 120 },
    },
    storage: "secondary-storage", // compteurs stockés dans Redis
  },

  // Stockage secondaire : toutes les données d'auth (sessions, etc.) vivent dans Redis
  secondaryStorage: {
    get: (key) => redis.get(key),
    set: (key, value, ttl) =>
      ttl
        ? redis.set(key, value, "EX", ttl).then(() => undefined)
        : redis.set(key, value).then(() => undefined),
    delete: (key) => redis.del(key).then(() => undefined),
    getAndDelete: async (key) => {
      const value = await redis.get(key);
      if (value !== null) await redis.del(key);
      return value;
    },
    increment: async (key, ttl) => {
      const value = await redis.incrby(key, 1);
      if (ttl) await redis.expire(key, ttl);
      return value;
    },
  },

  // Champs utilisateur additionnels : le rôle n'est pas modifiable par le client
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // interdit au client de s'auto-attribuer un rôle
      },
    },
  },

  // Durée de vie et rafraîchissement des sessions
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 jours
    updateAge: 60 * 60 * 24, // refresh quotidien
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // cache session 5 min
    },
  },

  // Plugins : admin (rôles) et nextCookies en dernier (obligatoire pour Next.js)
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(), // doit rester en dernier
  ],
});

// Type de session inféré automatiquement par Better Auth (utilisé côté app)
export type Session = typeof auth.$Infer.Session;

/**
 * Ferme toutes les connexions ouvertes par l'instance d'auth (Redis
 * secondary storage + pools Postgres contenu/identité). Utilisé par le
 * teardown global des tests E2E pour libérer l'event loop du runner ;
 * ne doit pas être appelé en cours d'exécution applicative.
 */
export async function closeAuthConnections() {
  await Promise.all([redis.quit(), closeDb(), closeAuthDb()]);
}
