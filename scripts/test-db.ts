/**
 * Script de diagnostic : teste la connexion à la base de données PostgreSQL.
 * Charge `.env.local`, affiche les composants de l'URL de connexion
 * (hôte, port, utilisateur, base), exécute `SELECT version()` et affiche
 * la version du serveur.
 */

// Chargement des variables d'environnement depuis .env.local
import { config } from "dotenv";
config({ path: ".env.local" });

// Client PostgreSQL bas niveau (sans préparation de requêtes)
import postgres from "postgres";

// Affichage des composants de l'URL de connexion pour vérification rapide
const url = new URL(process.env.DATABASE_URL!);
console.log("host :", url.hostname);
console.log("port :", url.port);
console.log("user :", url.username);
console.log("db   :", url.pathname);

/**
 * Point d'entrée du script : ouvre une connexion, exécute `SELECT version()`,
 * affiche la version du serveur puis ferme la connexion.
 */
async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  const result = await sql`SELECT version()`;
  console.log("✅ Connexion OK :", result[0].version);

  await sql.end();
}

main().catch((err) => {
  console.error("❌ Échec de connexion :", err);
  process.exit(1);
});
