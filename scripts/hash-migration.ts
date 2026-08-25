/**
 * Script utilitaire : calcule le hash SHA-256 de chaque fichier de migration SQL.
 * Permet de reproduire les hashes stockés dans `drizzle.__drizzle_migrations`
 * (utile pour `mark-migration-applied.ts` ou le débogage des migrations).
 */

// Lecture synchrone de fichiers
import { readFileSync } from "fs";
// Calcul du hash SHA-256
import { createHash } from "crypto";
// Listing synchrone du contenu d'un dossier
import { readdirSync } from "fs";

// Dossier contenant les migrations SQL générées par Drizzle
const dir = "db/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")); // Fichiers .sql uniquement

// Parcourt chaque migration et affiche son nom associé à son hash SHA-256
for (const file of files) {
  const content = readFileSync(`${dir}/${file}`, "utf-8");
  const hash = createHash("sha256").update(content).digest("hex");
  console.log(file, "->", hash);
}
