/**
 * Route /api/openapi.json — sert la spécification OpenAPI de l'API,
 * consommée par la page de documentation Swagger UI (/api/docs).
 */
// `NextResponse` : constructeur de réponses JSON pour les App Routes.
import { NextResponse } from "next/server";
// `buildDocument` : génère l'objet de spécification OpenAPI
// à partir des définitions centralisées dans `@/lib/api/openapi`.
import { buildDocument } from "@/lib/api/openapi";

// Force le rendu statique : la spécification est générée une fois au build.
export const dynamic = "force-static";

/**
 * GET /api/openapi.json — renvoie la spécification OpenAPI complète.
 *
 * @returns Réponse JSON contenant le document OpenAPI, avec un en-tête
 *   `cache-control` public d'une heure (la spec est stable entre builds).
 */
export function GET() {
  return NextResponse.json(buildDocument(), {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
