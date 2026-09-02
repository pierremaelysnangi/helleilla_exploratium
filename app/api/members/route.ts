/**
 * Routes /api/members — annuaire des membres.
 *
 * GET est public : un membre est une information encyclopédique, au même
 * titre qu'un groupe. POST suit la matrice des entités de catalogue
 * (`band:create`, donc contributor et au-delà) : créer une personne relève
 * de la même responsabilité éditoriale que créer un groupe.
 */

import { route } from "@/lib/api/handler";
import { ok, okPaginated } from "@/lib/api/response";
import { z } from "zod";
import { createMemberSchema } from "@/lib/validations/member";
import { listMembers } from "@/db/queries/members";
import { createMember } from "@/db/mutations/members";

const listMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
});

/** GET /api/members — annuaire paginé, filtrable par nom. */
export const GET = route(
  { query: listMembersQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { items, total } = await listMembers(query);
    return okPaginated(items, total, query.page, query.perPage);
  },
);

/** POST /api/members — crée une fiche membre (contributor+). */
export const POST = route(
  {
    body: createMemberSchema,
    permission: { resource: "band", action: "create" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body }) => ok(await createMember(body), { status: 201 }),
);
