/**
 * GET /api/albums/by-slug/:bandSlug/:albumSlug — lecture publique d'un
 * album par son slug, complément de GET /api/albums/:id qui exige un UUID.
 *
 * L'adressage est volontairement porté par DEUX segments : la contrainte
 * `albums_band_slug_uq` ne rend le slug unique qu'au sein d'un groupe, donc
 * un slug seul ne désigne pas un album de façon déterministe.
 */

// Wrapper standard : validation + rate limit (lecture publique)
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
// Validation des paramètres { bandSlug, albumSlug }
import { albumBySlugParamsSchema } from "@/lib/api/schemas";
// Accès données
import { db } from "@/db";
import { albums, bands } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * GET /api/albums/by-slug/:bandSlug/:albumSlug — album, groupe et pistes.
 *
 * @returns 200 `{ ...album, band, tracks }` ou 404 si le groupe ou l'album
 *   n'existe pas. Limité à 60 requêtes/minute.
 */
export const GET = route(
  {
    params: albumBySlugParamsSchema,
    rateLimit: { limit: 60, window: 60 },
  },
  async ({ params }) => {
    // Résolution en deux temps : le groupe borne l'unicité du slug d'album
    const band = await db.query.bands.findFirst({
      where: eq(bands.slug, params.bandSlug),
    });
    if (!band) return fail("NOT_FOUND", "Groupe introuvable");

    const row = await db.query.albums.findFirst({
      where: and(eq(albums.bandId, band.id), eq(albums.slug, params.albumSlug)),
      with: { tracks: true },
    });
    if (!row) return fail("NOT_FOUND", "Album introuvable");

    const { tracks: albumTracks, ...album } = row;

    // Ordre de la tracklist : disque puis piste (l'index unique en base
    // porte sur ce couple, mais la lecture relationnelle ne trie pas).
    const tracklist = [...albumTracks].sort(
      (a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber,
    );

    return ok({
      ...album,
      // Projection publique minimale du groupe (fil d'Ariane + liens)
      band: { id: band.id, name: band.name, slug: band.slug },
      tracks: tracklist,
    });
  },
);
