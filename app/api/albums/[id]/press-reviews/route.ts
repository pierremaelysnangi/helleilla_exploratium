/**
 * GET /api/albums/:id/press-reviews — critiques de presse d'un album.
 *
 * Public et sans agrégation cachée : la liste complète des critiques
 * accompagne leur moyenne et son effectif. Aucun texte rédactionnel
 * n'est renvoyé — la publication, la note et le lien vers l'article
 * suffisent à renvoyer le lecteur à la source, et le contenu appartient
 * à ses auteurs.
 */

import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { getAlbumById } from "@/db/queries/albums";
import { listPressReviews, getPressAverage } from "@/db/queries/pressReviews";

export const GET = route(
  { params: idParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ params }) => {
    const album = await getAlbumById(params.id);
    if (!album) return fail("NOT_FOUND", "Album introuvable");

    const [reviews, summary] = await Promise.all([
      listPressReviews(params.id),
      getPressAverage(params.id),
    ]);

    return ok({ reviews, ...summary });
  },
);
