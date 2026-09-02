/**
 * Instance Drizzle DÉDIÉE à la base d'identité (cloisonnement RGPD).
 *
 * Cette base héberge exclusivement les données sensibles Better Auth
 * (user, session, account, verification) — emails, hashes de mots de
 * passe, jetons de session — séparées de la base applicative.
 *
 * Priorité de résolution :
 * 1. IDENTITY_AUTH_DATABASE_URL -> projet identités dédié (cible finale) ;
 * 2. AUTH_DATABASE_URL          -> repli historique mono-base ;
 * 3. DATABASE_URL               -> repli ultime (démarrage initial).
 */

// Driver postgres-js réutilisé pour la seconde instance
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
// Tables d'identité uniquement (jamais les tables applicatives)
import { user, session, account, verification } from "@/db/schema/auth";
// Environnement validé au boot
import { env } from "@/lib/env";

/** URL de la base identité selon la chaîne de priorité ci-dessus. */
const authConnectionString =
  env.IDENTITY_AUTH_DATABASE_URL ??
  env.AUTH_DATABASE_URL ??
  process.env.DATABASE_URL!;

/**
 * Client SQL de la base identité. `prepare: false` requis derrière un
 * transaction pooler (pgbouncer) ; TLS obligatoire pour Supabase
 * (désactivé en local pour les bases de test non-TLS).
 */
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(
  authConnectionString,
);
const authClient = postgres(authConnectionString, {
  prepare: false,
  max: 5,
  ...(isLocal ? {} : { ssl: "require" }),
});

/** Instance Drizzle restreinte aux quatre tables d'authentification. */
export const authDb = drizzle(authClient, {
  schema: { user, session, account, verification },
});

/** Ferme le pool de la base identité (usage : teardown de tests). */
export const closeAuthDb = () => authClient.end({ timeout: 5 });
