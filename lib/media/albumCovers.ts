/**
 * Résolution des pochettes d'album.
 *
 * Chaîne : référence MusicBrainz du GROUPE -> ses release-groups ->
 * appariement avec nos albums -> pochette Cover Art Archive.
 *
 * Deux écritures, chacune avec son rôle :
 *
 * - `external_refs` reçoit l'identifiant du release-group : c'est la
 *   donnée canonique, celle qui permettra de re-résoudre plus tard ;
 * - `albums.cover_url` reçoit l'URL stable de l'archive, pour que les
 *   listes s'affichent sans requête supplémentaire. Une URL, jamais une
 *   copie du fichier — même principe que `bands.image_url`.
 *
 * Le release-group est stocké sous le provider `musicbrainz` : c'est bien
 * un identifiant MusicBrainz, Cover Art Archive n'en émettant aucun.
 */

import { db } from "@/db";
import { albums, externalRefs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  listReleaseGroups,
  matchReleaseGroup,
  hasCoverArt,
  coverArtUrl,
} from "@/lib/providers/coverart";

/** Bilan d'une résolution, pour journalisation ou affichage. */
export type CoverResolution = {
  /** Albums appariés à un release-group. */
  matched: number;
  /** Albums ayant effectivement reçu une pochette. */
  covered: number;
  /** Albums sans correspondance ou sans visuel archivé. */
  skipped: string[];
};

/**
 * Résout les pochettes de tous les albums d'un groupe.
 *
 * @param bandId - UUID du groupe.
 * @param artistMbid - Son identifiant MusicBrainz (issu d'external_refs).
 * @returns Le bilan de la résolution.
 */
export async function resolveAlbumCoversForBand(
  bandId: string,
  artistMbid: string,
): Promise<CoverResolution> {
  const [groups, bandAlbums] = await Promise.all([
    listReleaseGroups(artistMbid),
    db
      .select({
        id: albums.id,
        title: albums.title,
        releaseYear: albums.releaseYear,
        coverUrl: albums.coverUrl,
      })
      .from(albums)
      .where(eq(albums.bandId, bandId)),
  ]);

  const result: CoverResolution = { matched: 0, covered: 0, skipped: [] };

  for (const album of bandAlbums) {
    const group = matchReleaseGroup(groups, album);
    if (!group) {
      result.skipped.push(album.title);
      continue;
    }
    result.matched += 1;

    // Référence canonique : écrite même sans pochette disponible, elle
    // reste utile (rééditions, ré-essai ultérieur, liens sortants).
    await db
      .insert(externalRefs)
      .values({
        entityType: "album",
        entityId: album.id,
        provider: "musicbrainz",
        externalId: group.id,
      })
      .onConflictDoUpdate({
        target: [
          externalRefs.entityType,
          externalRefs.entityId,
          externalRefs.provider,
        ],
        set: { externalId: group.id, updatedAt: new Date() },
      });

    if (!(await hasCoverArt(group.id))) {
      result.skipped.push(album.title);
      continue;
    }

    await db
      .update(albums)
      .set({ coverUrl: coverArtUrl(group.id), updatedAt: new Date() })
      .where(eq(albums.id, album.id));
    result.covered += 1;
  }

  return result;
}

/**
 * Identifiant MusicBrainz d'un groupe, ou null s'il n'en a pas.
 *
 * Sans cette référence il n'y a aucune résolution possible : c'est le
 * point d'entrée de toute la chaîne.
 */
export async function getBandMusicbrainzId(
  bandId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ externalId: externalRefs.externalId })
    .from(externalRefs)
    .where(
      and(
        eq(externalRefs.entityType, "band"),
        eq(externalRefs.entityId, bandId),
        eq(externalRefs.provider, "musicbrainz"),
      ),
    )
    .limit(1);
  return row?.externalId ?? null;
}
