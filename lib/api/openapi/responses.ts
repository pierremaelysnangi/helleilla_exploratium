/**
 * Helpers de réponses pour la spec OpenAPI : catalogue d'erreurs
 * standardisées (401/403/404/422/429/500), enveloppe de succès JSON et
 * sélection d'un sous-ensemble de réponses d'erreur par code.
 */

// Types des objets réponses OpenAPI
import type { ZodOpenApiResponsesObject } from "zod-openapi";
import type { z } from "zod";
// Schéma d'erreur nommé + enveloppe de succès
import { ErrorSchema, okSchema } from "./schemas";

/** Fabrique une entrée de réponse d'erreur JSON avec sa description. */
function err(description: string) {
  return {
    description,
    content: { "application/json": { schema: ErrorSchema } },
  };
}

/** Réponses d'erreur réutilisables, indexées par code HTTP. */
export const errorResponses = {
  401: err("Non authentifié"),
  403: err("Permission refusée"),
  404: err("Ressource introuvable"),
  409: err("Conflit d'unicité (slug, email… déjà pris)"),
  422: err("Validation échouée"),
  429: err("Rate limit dépassé"),
  500: err("Erreur serveur"),
  503: err("Service dépendant indisponible (ex : Meilisearch)"),
} satisfies ZodOpenApiResponsesObject;

/**
 * Fabrique une réponse de succès 200/201 enveloppant les données.
 *
 * @param schema - Schéma zod du champ `data`.
 * @param description - Description de la réponse (défaut "Succès").
 * @returns Objet réponse OpenAPI prêt à insérer dans `responses`.
 */
export function jsonOk<T extends z.ZodType>(schema: T, description = "Succès") {
  return {
    description,
    content: { "application/json": { schema: okSchema(schema) } },
  };
}

/**
 * Sélectionne un sous-ensemble de réponses d'erreur par codes HTTP.
 *
 * @param codes - Codes à reprendre (ex : pick(401, 403)).
 * @returns Un objet `Pick` typé des réponses demandées.
 */
export function pick<K extends keyof typeof errorResponses>(
  ...codes: K[]
): Pick<typeof errorResponses, K> {
  return Object.fromEntries(codes.map((c) => [c, errorResponses[c]])) as Pick<
    typeof errorResponses,
    K
  >;
}
