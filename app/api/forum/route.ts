/**
 * Routes /api/forum — avis publiés sur un groupe ou un album.
 *
 * GET est public : une discussion sans lecteur n'a pas d'intérêt, et
 * rien de ce qui s'y trouve n'est personnel au-delà du nom affiché que
 * l'auteur a lui-même choisi.
 *
 * POST demande une session et la permission `forum:create`, accordée dès
 * le rôle `user` : donner son avis n'est pas contribuer à
 * l'encyclopédie, et exiger le rôle contributeur viderait la page.
 *
 * L'existence du sujet est vérifiée avant l'écriture. La clé étrangère
 * la garantirait, mais un 404 explicite vaut mieux qu'une violation de
 * contrainte traduite en 422.
 */

import { route } from "@/lib/api/handler";
import { ok, okPaginated, fail } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/schemas";
import {
  createForumPostSchema,
  forumListQuerySchema,
} from "@/lib/validations/forum";
import { listForumPosts } from "@/db/queries/forum";
import { createForumPost } from "@/db/mutations/forum";
import { getBandById } from "@/db/queries/bands";
import { getAlbumById } from "@/db/queries/albums";

const listQuerySchema = paginationSchema.extend(forumListQuerySchema.shape);

/** GET /api/forum — fil général, ou celui d'un groupe / d'un album. */
export const GET = route(
  { query: listQuerySchema, rateLimit: { limit: 60, window: 60 } },
  async ({ query }) => {
    const { page, perPage, bandId, albumId } = query;
    const { posts, total } = await listForumPosts(
      { bandId, albumId },
      page,
      perPage,
    );
    return okPaginated(posts, total, page, perPage);
  },
);

/** POST /api/forum — publie un avis. */
export const POST = route(
  {
    body: createForumPostSchema,
    permission: { resource: "forum", action: "create" },
    // Plus strict que les lectures : c'est une écriture publique, et
    // `failMode: "closed"` refuse plutôt que d'ouvrir la porte si Redis
    // ne répond pas.
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ body, session }) => {
    if (body.bandId && !(await getBandById(body.bandId))) {
      return fail("NOT_FOUND", "Groupe introuvable");
    }
    if (body.albumId && !(await getAlbumById(body.albumId))) {
      return fail("NOT_FOUND", "Album introuvable");
    }

    const post = await createForumPost({
      userId: session!.user.id,
      bandId: body.bandId,
      albumId: body.albumId,
      body: body.body,
    });

    return ok(post, { status: 201 });
  },
);
