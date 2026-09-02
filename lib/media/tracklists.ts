/**
 * Récupération des tracklists depuis MusicBrainz.
 *
 * Ne s'applique qu'aux albums DÉPOURVUS de pistes : une tracklist saisie
 * localement peut avoir été corrigée à la main, l'écraser avec la version
 * amont ferait perdre ce travail. Le remplissage est un complément, jamais
 * une synchronisation à sens unique.
 *
 * Dépend de la référence release-group posée par la résolution des
 * pochettes : sans elle, aucune tracklist n'est atteignable.
 */

import { db } from "@/db";
import { albums, externalRefs, tracks } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";
import { listReleaseGroupTracks } from "@/lib/providers/musicbrainz";

/** Bilan du remplissage pour un groupe. */
export type TracklistResolution = {
  /** Albums pour lesquels des pistes ont été écrites. */
  filled: number;
  /** Nombre total de pistes insérées. */
  tracks: number;
  /** Albums laissés tels quels (déjà pourvus, ou introuvables en amont). */
  skipped: string[];
};

/**
 * Complète les tracklists manquantes des albums d'un groupe.
 *
 * @param bandId - UUID du groupe.
 */
export async function fillMissingTracklists(
  bandId: string,
): Promise<TracklistResolution> {
  const rows = await db
    .select({
      id: albums.id,
      title: albums.title,
      releaseGroupId: externalRefs.externalId,
    })
    .from(albums)
    .innerJoin(
      externalRefs,
      and(
        eq(externalRefs.entityType, "album"),
        eq(externalRefs.entityId, albums.id),
        eq(externalRefs.provider, "musicbrainz"),
      ),
    )
    .where(eq(albums.bandId, bandId));

  const result: TracklistResolution = { filled: 0, tracks: 0, skipped: [] };

  for (const album of rows) {
    const [existing] = await db
      .select({ value: count() })
      .from(tracks)
      .where(eq(tracks.albumId, album.id));
    if ((existing?.value ?? 0) > 0) continue; // tracklist déjà documentée

    let upstream;
    try {
      upstream = await listReleaseGroupTracks(album.releaseGroupId);
    } catch {
      result.skipped.push(album.title);
      continue;
    }
    if (upstream.length === 0) {
      result.skipped.push(album.title);
      continue;
    }

    await db.insert(tracks).values(
      upstream.map((t) => ({
        albumId: album.id,
        title: t.title,
        trackNumber: t.trackNumber,
        discNumber: t.discNumber,
        durationMs: t.durationMs,
      })),
    );
    result.filled += 1;
    result.tracks += upstream.length;
  }

  return result;
}
