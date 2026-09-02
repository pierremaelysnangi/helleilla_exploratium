/**
 * Routes /api/bands/:id/members — formation d'un groupe.
 *
 * PUT applique une synchronisation COMPLÈTE, même sémantique que
 * `/genres` et `/refs` : l'appelant décrit l'état voulu, pas un delta.
 * Une liste vide détache tous les membres.
 */

import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { setBandMembersSchema } from "@/lib/validations/member";
import { listMembersByBandId } from "@/db/queries/members";
import { setBandMembers } from "@/db/mutations/members";

/** GET /api/bands/:id/members — formation, actifs puis anciens. */
export const GET = route(
  { params: idParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ params }) => ok(await listMembersByBandId(params.id)),
);

/** PUT /api/bands/:id/members — remplace la formation (contributor+). */
export const PUT = route(
  {
    params: idParamSchema,
    body: setBandMembersSchema,
    permission: { resource: "band", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    await setBandMembers(params.id, body.members);
    return ok(await listMembersByBandId(params.id));
  },
);
