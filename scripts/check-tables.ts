/**
 * Script de diagnostic : liste toutes les tables du schéma `public`.
 * Utile pour vérifier l'état réel de la base après une migration.
 */

// Client PostgreSQL bas niveau (sans préparation de requêtes)
import postgres from "postgres";

// Connexion directe à la base via DIRECT_URL
const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

/**
 * Point d'entrée du script : interroge information_schema pour lister
 * les tables publiques, les affiche, puis ferme la connexion.
 */
async function main() {
  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log(rows);
  await sql.end();
}

main();
