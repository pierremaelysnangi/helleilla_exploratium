/**
 * Script d'export de la spécification OpenAPI.
 * Construit le document OpenAPI depuis `lib/api/openapi` et l'écrit
 * dans `openapi/openapi.json` à la racine du projet.
 */

// API async du système de fichiers pour créer le dossier et écrire le fichier
import { mkdir, writeFile } from "node:fs/promises";
// Utilitaires de chemins : résolution du fichier de sortie
import { dirname, resolve } from "node:path";
// Générateur du document OpenAPI de l'application
import { buildDocument } from "../lib/api/openapi";

/**
 * Point d'entrée du script : génère le document OpenAPI, crée le dossier
 * `openapi/` si nécessaire et y écrit le JSON formaté (2 espaces).
 */
async function main() {
  const out = resolve(process.cwd(), "openapi/openapi.json");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(buildDocument(), null, 2)}\n`, "utf8");
  console.log(`✅ OpenAPI exporté → ${out}`);
}

// Lancement du script avec sortie en erreur (code 1) en cas d'échec
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
