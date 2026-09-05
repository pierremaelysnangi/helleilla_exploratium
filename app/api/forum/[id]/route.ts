/**
 * DELETE /api/forum/:id — retire un avis.
 *
 * Deux titres légitimes, et deux seulement : en être l'auteur, ou
 * disposer de `forum:delete` (modération et administration). La
 * vérification d'appartenance se fait ici et non dans la matrice RBAC :
 * une matrice décrit des rôles, pas des liens entre une personne et une
 * ligne précise.
 *
 * Un avis ne se modifie pas — réécrire un message déjà lu changerait le
 * sens d'une discussion après coup. D'où l'absence de PATCH.
 */

import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { getForumPostAuthor } from "@/db/queries/forum";
import { deleteForumPost } from "@/db/mutations/forum";
import { can } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/rbac/roles";

export const DELETE = route(
  {
    params: idParamSchema,
    auth: true,
    rateLimit: { limit: 30, window: 60, failMode: "closed" },
  },
  async ({ params, session }) => {
    const authorId = await getForumPostAuthor(params.id);
    if (!authorId) return fail("NOT_FOUND", "Avis introuvable");

    const role = (session!.user.role ?? "user") as Role;
    const isAuthor = authorId === session!.user.id;
    if (!isAuthor && !can(role, "forum", "delete")) {
      return fail("FORBIDDEN", "Permission insuffisante");
    }

    await deleteForumPost(params.id);
    return ok({ deleted: true });
  },
);
