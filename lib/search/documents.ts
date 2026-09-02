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

/**
 * Contexte du groupe joint aux documents album et piste.
 *
 * Indispensable, pas décoratif : l'URL canonique d'un album est
 * band-scopée. Sans le slug du groupe, un résultat de recherche ne peut
 * pas produire de lien valide — le composant en fabriquait un faux, qui
 * menait à une page inexistante.
 */
export type BandContext = {
  slug: string;
  name: string;
  /** Visuel du groupe : repli des pochettes absentes dans les résultats. */
  imageUrl: string | null;
};

/** Contexte de l'album joint aux documents piste. */
export type AlbumContext = {
  slug: string;
  title: string;
  coverUrl: string | null;
};

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
export function albumDocument(
  album: typeof albums.$inferSelect,
  band: BandContext,
) {
  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    bandId: album.bandId,
    bandSlug: band.slug,
    bandName: band.name,
    bandImageUrl: band.imageUrl,
    type: album.type,
    releaseYear: album.releaseYear,
    releaseDate: album.releaseDate,
    coverUrl: album.coverUrl,
  };
}

/** Document « piste » indexé. */
export function trackDocument(
  track: typeof tracks.$inferSelect,
  album: AlbumContext,
  band: BandContext,
) {
  return {
    id: track.id,
    title: track.title,
    albumId: track.albumId,
    albumSlug: album.slug,
    albumTitle: album.title,
    bandSlug: band.slug,
    bandName: band.name,
    bandImageUrl: band.imageUrl,
    coverUrl: album.coverUrl,
    trackNumber: track.trackNumber,
    durationMs: track.durationMs,
  };
}
