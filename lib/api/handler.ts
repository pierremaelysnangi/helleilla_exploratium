import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { can, type Action, type Resource } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/rbac/roles";
import { fail, failZod, ApiError } from "./response";
import { rateLimit, clientIp } from "./rate-limit";
import type { NextRequest } from "next/server";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

type Ctx<TBody, TQuery, TParams> = {
  req: NextRequest;
  body: TBody;
  query: TQuery;
  params: TParams;
  session: Session;
};

type RouteConfig<TBody, TQuery, TParams> = {
  body?: z.ZodType<TBody>;
  query?: z.ZodType<TQuery>;
  params?: z.ZodType<TParams>;
  auth?: boolean;
  permission?: { resource: Resource; action: Action };
  rateLimit?: { limit: number; window: number; failMode?: "open" | "closed" };
};

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
    } catch (err) {
      if (err instanceof z.ZodError) return failZod(err);
      if (err instanceof ApiError)
        return fail(err.code, err.message, err.details);
      console.error("[API]", err);
      return fail("INTERNAL", "Erreur serveur");
    }
  };
}
