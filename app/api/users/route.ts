/**
 * Route GET /api/users — liste d'administration des comptes.
 *
 * La matrice RBAC n'accorde `user:read` qu'aux administrateurs : c'est la
 * seule route de l'application qui expose des emails, et elle n'a de sens
 * que pour gérer les rôles et les bannissements.
 */

// Wrapper standard : rate limit + RBAC + validation
import { route } from "@/lib/api/handler";
import { okPaginated } from "@/lib/api/response";
// Contrat de la query (source unique)
import { listUsersQuerySchema } from "@/lib/validations/user";
// Lecture en base identité
import { listUsers } from "@/db/queries/users";

/**
 * GET /api/users?page&perPage&q&role — comptes paginés.
 *
 * @returns 200 `{ data, meta }`, 403 pour tout rôle autre qu'admin.
 */
export const GET = route(
  {
    query: listUsersQuerySchema,
    permission: { resource: "user", action: "read" },
    rateLimit: { limit: 60, window: 60 },
  },
  async ({ query }) => {
    const { items, total } = await listUsers(query);
    return okPaginated(items, total, query.page, query.perPage);
  },
);
