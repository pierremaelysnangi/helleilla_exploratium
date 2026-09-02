import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema/index.ts",
  /**
   * Tables d'identité EXCLUES du périmètre de cette configuration.
   *
   * Elles appartiennent à la base dédiée (`drizzle.auth.config.ts`) au
   * titre du cloisonnement RGPD, mais existent encore physiquement dans la
   * base contenu — vestiges du mode mono-base initial. Sans ce filtre,
   * drizzle-kit les voit en base sans les voir dans le schéma et propose
   * un `DROP TABLE` à chaque génération : destructif, et fatal en mode
   * mono-base (tests E2E) où ces tables portent les vrais comptes.
   *
   * Les retirer physiquement de la base contenu est une décision
   * distincte, à prendre une fois la migration des identités confirmée
   * (voir scripts/migrate-auth-db.ts).
   */
  tablesFilter: ["!user", "!session", "!account", "!verification"],
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Session pooler (5432) — nécessaire pour le DDL
    url: process.env.DIRECT_URL!,
  },
  verbose: true,
  strict: true,
});
