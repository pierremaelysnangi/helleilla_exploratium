/**
 * Configuration Drizzle Kit pour la BASE IDENTITÉ dédiée (RGPD).
 * Séparée de drizzle.config.ts : le schéma applicatif et les migrations
 * d'authentification évoluent indépendamment.
 *
 * Usage :
 *   pnpm db:generate:auth   # génère les migrations depuis db/schema/auth.ts
 *   pnpm db:migrate:auth    # applique sur AUTH_DATABASE_URL
 */
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  // Uniquement les tables d'identité — pas le schéma applicatif
  schema: "./db/schema/auth.ts",
  out: "./db/migrations-auth",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.AUTH_DATABASE_URL!,
    // Supabase exige TLS sur les connexions directes
    ssl: "require",
  },
  verbose: true,
  strict: true,
});
