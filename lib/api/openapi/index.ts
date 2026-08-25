/**
 * Point d'entrée du module OpenAPI.
 * L'import de `./paths` déclenche l'enregistrement des opérations,
 * puis on ré-exporte `buildDocument` pour générer le document final.
 */

// Effet de bord : enregistre toutes les routes dans le registre
import "./paths";
export { buildDocument } from "./registry";
