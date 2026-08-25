/**
 * Registre central des chemins OpenAPI.
 * Les modules (paths.ts) y enregistrent leurs opérations via
 * `registerPath` ; `buildDocument` assemble ensuite le document 3.1
 * complet (info, tags, sécurité, composants) via zod-openapi.
 */

// Génération du document OpenAPI depuis les schémas zod annotés
import { createDocument } from "zod-openapi";
import type { ZodOpenApiObject, ZodOpenApiPathsObject } from "zod-openapi";

// Accumulateur des opérations enregistrées à l'import des modules paths
const paths: ZodOpenApiPathsObject = {};

/**
 * Construit un operationId lisible et unique depuis la méthode et le chemin,
 * ex : GET /api/bands/{id} -> "getBandsById".
 *
 * @param method - Méthode HTTP de l'opération.
 * @param path - Chemin de l'API ("/api/bands/{id}").
 * @returns L'operationId en camelCase.
 */
function toOperationId(method: string, path: string): string {
  const parts = path
    .replace(/^\/api\//, "")
    .split("/")
    .filter(Boolean)
    .map((p) =>
      p.startsWith("{")
        ? `By${p.slice(1, -1).replace(/^\w/, (c) => c.toUpperCase())}`
        : p,
    );
  const base = parts
    .map((p, i) => (i === 0 ? p : p.replace(/^\w/, (c) => c.toUpperCase())))
    .join("");
  return `${method}${base.replace(/^\w/, (c) => c.toUpperCase())}`;
}

/**
 * Enregistre une opération pour un chemin/méthode donné et lui assigne
 * automatiquement un operationId.
 *
 * @param path - Chemin de l'API (ex : "/api/bands/{id}").
 * @param method - Méthode HTTP de l'opération.
 * @param operation - Définition OpenAPI (tags, summary, responses...).
 */
export function registerPath(
  path: string,
  method: "get" | "post" | "patch" | "delete" | "put",
  operation: NonNullable<ZodOpenApiPathsObject[string]>[typeof method],
) {
  paths[path] ??= {};
  Object.assign(paths[path], {
    [method]: { operationId: toOperationId(method, path), ...operation },
  });
}

/** Retourne les chemins enregistrés à ce jour (lecture seule côté appelant). */
export function getPaths(): ZodOpenApiPathsObject {
  return paths;
}

/**
 * Assemble et retourne le document OpenAPI 3.1 complet :
 * métadonnées, tags documentaires, schéma de sécurité par cookie de
 * session et l'ensemble des chemins du registre.
 *
 * @returns Le document OpenAPI généré par zod-openapi.
 */
export function buildDocument(): ReturnType<typeof createDocument> {
  const doc: ZodOpenApiObject = {
    openapi: "3.1.0",
    info: {
      title: "Helleilla Exploratium API",
      version: "0.1.0",
      description:
        "API de catalogue metal — bands, albums, tracks, genres. Réponses au format `{ ok, data }` / `{ ok: false, error }`.",
      license: {
        name: "AGPL-3.0-or-later",
        identifier: "AGPL-3.0-or-later",
      },
    },
    servers: [
      { url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" },
    ],
    tags: [
      { name: "bands", description: "Groupes et projets musicaux." },
      { name: "albums", description: "Sorties : albums, EP, splits, démos." },
      { name: "tracks", description: "Morceaux rattachés à un album." },
      { name: "genres", description: "Taxonomie des genres et sous-genres." },
      { name: "search", description: "Recherche plein texte via Meilisearch." },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "authjs.session-token",
        },
        // Secret machine-to-machine du endpoint /api/revalidate
        revalidateSecret: {
          type: "apiKey",
          in: "header",
          name: "x-revalidate-secret",
        },
      },
    },
    paths: getPaths(),
  };

  const built = createDocument(doc);

  // zod-openapi peut ne pas propager certains champs : on force depuis la source.
  built.info.license = doc.info.license;
  built.tags = doc.tags;

  return built;
}
