/**
 * Script de réparation de migrations : marque manuellement une migration
 * comme appliquée dans la table interne `drizzle.__drizzle_migrations`.
 * Recrée le schéma/table si absents, puis insère le hash SHA-256 du fichier
 * SQL (utile quand Drizzle échoue à moitié sur une migration déjà jouée).
 */

// Client PostgreSQL bas niveau (sans préparation de requêtes)
import postgres from "postgres";
// Lecture synchrone du fichier de migration
import { readFileSync } from "fs";
// Calcul du hash SHA-256 du contenu SQL
import { createHash } from "crypto";

// Connexion directe à la base via DIRECT_URL
const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

// Lecture du fichier de migration à marquer comme appliqué
const migrationSQL = readFileSync(
  "db/migrations/0000_grey_luckman.sql",
  "utf-8",
);
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
  console.log("Migration marked as applied:", hash);
  await sql.end();
}

main();
