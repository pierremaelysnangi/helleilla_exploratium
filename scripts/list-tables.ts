/**
 * Script de diagnostic : liste les tables du schéma `public` via Drizzle.
 * Variante de `check-tables.ts` utilisant l'instance Drizzle (`@/db`)
 * au lieu du client postgres brut. Affiche le résultat sous forme de table.
 */

// Helper SQL brut de Drizzle ORM
import { sql } from "drizzle-orm";
import { db } from "@/db"; // Instance Drizzle partagée

/**
 * Point d'entrée du script : exécute la requête d'inventaire des tables,
 * affiche le résultat en tableau puis termine le processus avec code 0.
 */
async function main() {
  const r = await db.execute(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' ORDER BY table_name
  `);
  console.table(r);
  process.exit(0);
}

main();
