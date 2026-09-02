/**
 * PUT /api/bands/:id/refs — remplace les références externes d'un groupe.
 * Sémantique "sync" idempotente (miroir de PUT /genres) : la liste
 * fournie devient l'unique vérité. Chaque référence est un couple
 * { provider, externalId } ; le cache média est invalidé.
 */

// Wrapper standard : validation + RBAC + rate limit strict
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { z } from "zod";
// Mutation transactionnelle + invalidation du cache média
import { setExternalRefs } from "@/db/mutations/externalRefs";
import { invalidateBandMedia } from "@/lib/media/resolver";
// Vérification d'existence du groupe
import { getBandById } from "@/db/queries/bands";

/** Valeurs de l'enum PostgreSQL external_provider (source : schéma Drizzle). */
const providerSchema = z.enum([
  "musicbrainz",
  "discogs",
  "wikidata",
  "spotify",
  "youtube",
  "bandcamp",
  "deezer",
]);

/** Corps accepté : liste de références, max 8 plateformes. */
const setBandRefsSchema = z.object({
  refs: z
    .array(
      z.object({
        provider: providerSchema,
        /** Identifiant chez la plateforme (UUID MBID, ID numérique Discogs…). */
        externalId: z.string().trim().min(1).max(200),
      }),
    )
    .max(8),
});

/**
 * PUT /api/bands/:id/refs — sync complète des références externes.
 *
 * Réservé aux utilisateurs ayant la permission `band:update`
 * (contributor et au-delà). Rate limit strict (10/min, failMode closed).
 *
 * @returns 200 `{ bandId, refs }` après synchronisation + invalidation
 *   du cache média, ou 404 si le groupe n'existe pas.
 */
export const PUT = route(
  {
    params: idParamSchema,
    body: setBandRefsSchema,
    permission: { resource: "band", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    const band = await getBandById(params.id);
    if (!band) return fail("NOT_FOUND", "Groupe introuvable");

    await setExternalRefs("band", params.id, body.refs);
    // Le DTO média dépend des refs -> purge pour résolution fraîche
    await invalidateBandMedia(params.id);

    return ok({ bandId: params.id, refs: body.refs });
  },
);
