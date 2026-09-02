/**
 * Script de réparation de migrations : marque manuellement une migration
 * comme appliquée dans la table interne `drizzle.__drizzle_migrations`.
 * Recrée le schéma/table si absents, puis insère le hash SHA-256 du fichier
 * SQL (utile quand Drizzle échoue à moitié sur une migration déjà jouée).
 *
 * Usage : `tsx --env-file=.env.local scripts/mark-migration-applied.ts <fichier.sql>`
 *
 * Le nom du fichier était auparavant CODÉ EN DUR sur la toute première
 * migration : passé 0000, l'outil marquait donc silencieusement la
 * mauvaise migration comme appliquée.
 */

// Client PostgreSQL bas niveau (sans préparation de requêtes)
import postgres from "postgres";
// Lecture synchrone du fichier de migration
import { readFileSync } from "fs";
// Calcul du hash SHA-256 du contenu SQL
import { createHash } from "crypto";

// Connexion directe à la base via DIRECT_URL
const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

// Migration visée, passée en argument (nom de fichier ou chemin complet)
const arg = process.argv[2];
if (!arg) {
  console.error(
    "Usage : tsx scripts/mark-migration-applied.ts <migration.sql>\n" +
      "Exemple : tsx scripts/mark-migration-applied.ts 0005_clever_peter_parker.sql",
  );
  process.exit(1);
}
const migrationPath = arg.includes("/") ? arg : `db/migrations/${arg}`;

// Lecture du fichier de migration à marquer comme appliqué
const migrationSQL = readFileSync(migrationPath, "utf-8");
// Hash SHA-256, identique au format attendu par Drizzle Kit
const hash = createHash("sha256").update(migrationSQL).digest("hex");

/**
 * Point d'entrée du script : garantit l'existence du schéma `drizzle`
 * et de sa table de migrations, y insère le hash calculé,
 * puis ferme la connexion.
 */
async function main() {
  await sql`
    CREATE SCHEMA IF NOT EXISTS drizzle;
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `;
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${Date.now()});
  `;
  console.log(`Migration ${migrationPath} marquée comme appliquée :`, hash);
  await sql.end();
}

main();
