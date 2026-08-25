/**
 * Script de diagnostic : liste les migrations enregistrées dans PostgreSQL.
 * Affiche le contenu de la table `drizzle.__drizzle_migrations`
 * pour vérifier quelles migrations Drizzle ont été marquées comme appliquées.
 */

// Client PostgreSQL bas niveau (sans préparation de requêtes, requis pour certains hébergeurs)
import postgres from "postgres";

// Connexion directe à la base via DIRECT_URL
const sql = postgres(process.env.DIRECT_URL!, { prepare: false });

/**
 * Point d'entrée du script : lit et affiche toutes les migrations appliquées,
 * puis ferme proprement la connexion.
 */
async function main() {
  const rows = await sql`SELECT * FROM drizzle.__drizzle_migrations`;
  console.log(rows);
  await sql.end();
}

main();
