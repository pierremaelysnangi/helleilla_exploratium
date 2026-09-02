/**
 * @file Projections des entités vers les documents Meilisearch.
 *
 * Source unique de la forme indexée. Deux chemins alimentent l'index —
 * les jobs BullMQ au fil de l'eau, et la réindexation en masse — et deux
 * projections divergentes produiraient des résultats de recherche
 * différents selon la façon dont un document est entré dans l'index.
 *
 * Toute évolution ici doit rester alignée sur les schémas `*HitSchema`
 * de `lib/api/schemas.ts`, qui contractualisent ce que la recherche
 * renvoie au client.
 */

import type { bands, albums, tracks } from "@/db/schema";

/** Document « groupe » indexé. */
export function bandDocument(band: typeof bands.$inferSelect) {
  return {
    id: band.id,
    name: band.name,
    slug: band.slug,
    bio: band.bio,
    countryCode: band.countryCode,
    formedYear: band.formedYear,
  };
}

/** Document « album » indexé. */
export function albumDocument(album: typeof albums.$inferSelect) {
  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    bandId: album.bandId,
    type: album.type,
    releaseDate: album.releaseDate,
  };
}

/** Document « piste » indexé. */
export function trackDocument(track: typeof tracks.$inferSelect) {
  return {
    id: track.id,
    title: track.title,
    albumId: track.albumId,
    trackNumber: track.trackNumber,
    durationMs: track.durationMs,
  };
}
