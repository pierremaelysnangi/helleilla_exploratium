/**
 * Routes /api/albums/:id/ratings — appréciations d'un album.
 *
 * GET est public et ne renvoie qu'un AGRÉGAT (moyenne, nombre de votes) :
 * exposer qui a noté quoi révélerait les goûts d'une personne identifiable.
 * La note personnelle n'est jointe que si l'appelant est connecté, et il ne
 * reçoit alors que la sienne.
 *
 * PUT est un upsert : une personne ne dispose que d'une note par album,
 * garantie par la clé primaire composée. Sans cela, voter en boucle
 * fausserait la moyenne.
 */

import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { setRatingSchema } from "@/lib/validations/collection";
import { getRatingSummary, getUserRating } from "@/db/queries/collections";
import { setUserRating, deleteUserRating } from "@/db/mutations/collections";
import { getAlbumById } from "@/db/queries/albums";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** GET /api/albums/:id/ratings — moyenne publique + note personnelle. */
export const GET = route(
  { params: idParamSchema, rateLimit: { limit: 60, window: 60 } },
  async ({ params }) => {
    const summary = await getRatingSummary(params.id);

    // Lecture d'opportunité : la route reste publique, mais un appelant
    // connecté récupère sa propre note dans la même requête.
    const session = await auth.api.getSession({ headers: await headers() });
    const mine = session
      ? await getUserRating(session.user.id, params.id)
      : null;

    return ok({ ...summary, mine });
  },
);

/** PUT /api/albums/:id/ratings — enregistre la note de l'appelant. */
export const PUT = route(
  {
    params: idParamSchema,
    body: setRatingSchema,
    auth: true,
    rateLimit: { limit: 30, window: 60, failMode: "closed" },
  },
  async ({ params, body, session }) => {
    // L'album doit exister : la FK le garantirait, mais un 404 explicite
    // vaut mieux qu'une violation de contrainte traduite en 422.
    if (!(await getAlbumById(params.id))) {
      return fail("NOT_FOUND", "Album introuvable");
    }

    await setUserRating(session!.user.id, params.id, body.score);
    const summary = await getRatingSummary(params.id);
    return ok({ ...summary, mine: body.score });
  },
);

/** DELETE /api/albums/:id/ratings — retire sa note. */
export const DELETE = route(
  {
    params: idParamSchema,
    auth: true,
    rateLimit: { limit: 30, window: 60, failMode: "closed" },
  },
  async ({ params, session }) => {
    await deleteUserRating(session!.user.id, params.id);
    const summary = await getRatingSummary(params.id);
    return ok({ ...summary, mine: null });
  },
);
