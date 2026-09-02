/**
 * Routes /api/me/collection — collection et liste d'envies.
 *
 * Toujours cadrées sur la session : l'identifiant d'utilisateur n'est
 * jamais un paramètre d'entrée. Une route acceptant un `userId` laisserait
 * n'importe qui lire les goûts d'autrui en changeant un chiffre d'URL.
 */

import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { z } from "zod";
import {
  setCollectionSchema,
  collectionStatusSchema,
} from "@/lib/validations/collection";
import { listUserAlbums } from "@/db/queries/collections";
import {
  setUserAlbumStatus,
  removeUserAlbum,
} from "@/db/mutations/collections";
import { getAlbumById } from "@/db/queries/albums";

/** GET /api/me/collection?status= — liste personnelle de l'appelant. */
export const GET = route(
  {
    auth: true,
    query: z.object({ status: collectionStatusSchema.optional() }),
    rateLimit: { limit: 60, window: 60 },
  },
  async ({ query, session }) =>
    ok(await listUserAlbums(session!.user.id, query.status)),
);

/** PUT /api/me/collection — ajoute un album ou change son statut. */
export const PUT = route(
  {
    auth: true,
    body: setCollectionSchema,
    rateLimit: { limit: 30, window: 60, failMode: "closed" },
  },
  async ({ body, session }) => {
    if (!(await getAlbumById(body.albumId))) {
      return fail("NOT_FOUND", "Album introuvable");
    }
    await setUserAlbumStatus(session!.user.id, body.albumId, body.status);
    return ok(await listUserAlbums(session!.user.id));
  },
);

/** DELETE /api/me/collection?albumId= — retire un album de la liste. */
export const DELETE = route(
  {
    auth: true,
    query: z.object({ albumId: z.string().uuid() }),
    rateLimit: { limit: 30, window: 60, failMode: "closed" },
  },
  async ({ query, session }) => {
    await removeUserAlbum(session!.user.id, query.albumId);
    return ok(await listUserAlbums(session!.user.id));
  },
);
