/**
 * Fabrique de route handlers Next.js (`route()`).
 * Enrobe un handler métier avec : rate limiting, authentification,
 * contrôle de permission RBAC et validation zod des params/query/body.
 * Les erreurs (zod, ApiError, inconnues) sont converties en réponses JSON
 * standardisées.
 */

// Validation des entrées de la requête via schémas zod
import { z } from "zod";
// Authentification Better Auth + lecture des headers de la requête
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
// Contrôle d'accès : fonction `can` et types ressource/action
import { can, type Action, type Resource } from "@/lib/rbac/permissions";
// Type du rôle utilisateur (user/contributor/moderator/admin)
import type { Role } from "@/lib/rbac/roles";
// Réponses d'erreur standardisées et exception ApiError
import { fail, failZod, ApiError } from "./response";
// Conversion des erreurs SQLSTATE PostgreSQL en erreurs API propres
import { pgErrorToApiError } from "./db-errors";
// Rate limiting Redis + extraction de l'IP client
import { rateLimit, clientIp } from "./rate-limit";
import type { NextRequest } from "next/server";

/** Type de session Better Auth renvoyée par getSession. */
type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

/** Contexte transmis au handler métier après traitement par le middleware. */
type Ctx<TBody, TQuery, TParams> = {
  req: NextRequest;
  body: TBody;
  query: TQuery;
  params: TParams;
  session: Session;
};

/** Configuration déclarative d'une route : validation + sécurité. */
type RouteConfig<TBody, TQuery, TParams> = {
  body?: z.ZodType<TBody>;
  query?: z.ZodType<TQuery>;
  params?: z.ZodType<TParams>;
  auth?: boolean;
  permission?: { resource: Resource; action: Action };
  rateLimit?: { limit: number; window: number; failMode?: "open" | "closed" };
};

/**
 * Crée un route handler sécurisé à partir d'une configuration et d'un
 * handler métier. Le pipeline s'exécute dans cet ordre :
 * rate limit -> authentification -> permission RBAC ->
 * validation params/query/body -> handler métier.
 *
 * @param config - Options de sécurité et schémas de validation de la route.
 * @param handler - Fonction métier recevant le contexte typé (req, body,
 *                  query, params, session) et retournant une Response.
 * @returns Un handler compatible avec les signatures Next.js App Router
 *          `(req, { params }) => Promise<Response>`.
 */
export function route<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
>(
  config: RouteConfig<TBody, TQuery, TParams>,
  handler: (ctx: Ctx<TBody, TQuery, TParams>) => Promise<Response>,
) {
  return async (
    req: NextRequest,
    segment: { params: Promise<Record<string, string>> },
  ) => {
    try {
      if (config.rateLimit) {
        const limited = await rateLimit({
          key: `${req.nextUrl.pathname}:${clientIp(req)}`,
          ...config.rateLimit,
        });
        if (limited) return limited;
      }

      let session: Session = null;
      if (config.auth || config.permission) {
        session = await auth.api.getSession({ headers: await headers() });
        if (!session) return fail("UNAUTHORIZED", "Authentification requise");
      }

      if (config.permission) {
        const role = (session!.user.role ?? "user") as Role;
        if (!can(role, config.permission.resource, config.permission.action)) {
          return fail("FORBIDDEN", "Permission insuffisante");
        }
      }

      const rawParams = await segment.params;
      const params = config.params
        ? config.params.parse(rawParams)
        : (rawParams as TParams);

      const rawQuery = Object.fromEntries(req.nextUrl.searchParams);
      const query = config.query
        ? config.query.parse(rawQuery)
        : (rawQuery as TQuery);

      let body = undefined as TBody;
      if (config.body) {
        const json = await req.json().catch(() => ({}));
        body = config.body.parse(json);
      }

      return await handler({ req, body, query, params, session });
      // Conversion centralisée des erreurs en réponses JSON standardisées
    } catch (err) {
      if (err instanceof z.ZodError) return failZod(err);
      if (err instanceof ApiError)
        return fail(err.code, err.message, err.details);
      // Violation de contrainte SQL -> 409/422 explicite, pas un 500 générique
      const pgError = pgErrorToApiError(err);
      if (pgError) return fail(pgError.code, pgError.message, pgError.details);
      console.error("[API]", err);
      return fail("INTERNAL", "Erreur serveur");
    }
  };
}
