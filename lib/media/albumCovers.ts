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
// Repli quand Cover Art Archive n'archive aucun visuel
import { findAlbumCover } from "@/lib/providers/deezer";
// Écriture des références, partagée avec l'import de discographie
import { linkAlbumToReleaseGroup } from "./refs";

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
  bandName: string,
): Promise<CoverResolution> {
  const [groups, bandAlbums] = await Promise.all([
    listReleaseGroups(artistMbid),
    db
      .select({
        id: albums.id,
        title: albums.title,
        // Le type départage les homonymes de même année (« Monotheist »
        // existe en album et en EP, tous deux datés 2006).
        type: albums.type,
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
      // Sans release-group, il reste la plateforme : une pochette vaut
      // mieux qu'un monogramme, même sans référence encyclopédique.
      const fallback = await findAlbumCover(bandName, album.title);
      if (fallback) {
        await db
          .update(albums)
          .set({ coverUrl: fallback, updatedAt: new Date() })
          .where(eq(albums.id, album.id));
        result.covered += 1;
      } else {
        result.skipped.push(album.title);
      }
      continue;
    }
    result.matched += 1;

    // Référence canonique : écrite même sans pochette disponible, elle
    // reste utile (rééditions, ré-essai ultérieur, liens sortants). Un
    // identifiant déjà rattaché à un autre album n'est pas déplacé —
    // l'index unique `(provider, external_id)` l'interdit, et forcer
    // faisait échouer toute la passe du groupe.
    if (!(await linkAlbumToReleaseGroup(album.id, group.id))) {
      result.skipped.push(`${album.title} (référence déjà attribuée)`);
      continue;
    }

    // Cover Art Archive d'abord (visuel de l'édition de référence),
    // Deezer ensuite pour ne laisser aucune sortie sans pochette.
    const cover = (await hasCoverArt(group.id))
      ? coverArtUrl(group.id)
      : await findAlbumCover(bandName, album.title);

    if (!cover) {
      result.skipped.push(album.title);
      continue;
    }

    await db
      .update(albums)
      .set({ coverUrl: cover, updatedAt: new Date() })
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
