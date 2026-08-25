import type { ZodOpenApiResponsesObject } from "zod-openapi";
import type { z } from "zod";
import { ErrorSchema, okSchema } from "./schemas";

function err(description: string) {
  return {
    description,
    content: { "application/json": { schema: ErrorSchema } },
  };
}

export const errorResponses = {
  401: err("Non authentifié"),
  403: err("Permission refusée"),
  404: err("Ressource introuvable"),
  422: err("Validation échouée"),
  429: err("Rate limit dépassé"),
  500: err("Erreur serveur"),
} satisfies ZodOpenApiResponsesObject;

export function jsonOk<T extends z.ZodType>(schema: T, description = "Succès") {
  return {
    description,
    content: { "application/json": { schema: okSchema(schema) } },
  };
}

export function pick<K extends keyof typeof errorResponses>(
  ...codes: K[]
): Pick<typeof errorResponses, K> {
  return Object.fromEntries(codes.map((c) => [c, errorResponses[c]])) as Pick<
    typeof errorResponses,
    K
  >;
}
