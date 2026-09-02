/**
 * Renseigne le visuel d'un groupe depuis Wikidata.
 *
 * Le resolver média agrège déjà cette image à l'affichage, mais elle
 * n'était jamais persistée : les cartes de groupe, qui lisent
 * `bands.image_url`, affichaient donc toutes un monogramme.
 *
 * On stocke une URL vers l'image hébergée par Wikimedia, jamais une copie
 * du fichier — même principe que les pochettes.
 *
 * N'écrase pas un visuel déjà renseigné : un choix éditorial local prime
 * sur la reprise automatique.
 */

import { db } from "@/db";
import { bands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getArtist, extractWikidataId } from "@/lib/providers/musicbrainz";
import { getEntityImageUrl } from "@/lib/providers/wikidata";

/**
 * Résout et enregistre le visuel d'un groupe.
 *
 * @param bandId - UUID du groupe.
 * @param artistMbid - Son identifiant MusicBrainz.
 * @returns L'URL retenue, ou `null` si aucune image n'est disponible.
 */
export async function resolveBandImage(
  bandId: string,
  artistMbid: string,
): Promise<string | null> {
  const [existing] = await db
    .select({ imageUrl: bands.imageUrl })
    .from(bands)
    .where(eq(bands.id, bandId))
    .limit(1);
  if (existing?.imageUrl) return existing.imageUrl;

  // Wikidata n'est atteignable qu'via l'identifiant porté par MusicBrainz
  const artist = await getArtist(artistMbid);
  const wikidataId = extractWikidataId(artist);
  if (!wikidataId) return null;

  const url = await getEntityImageUrl(wikidataId);
  if (!url) return null;

  await db
    .update(bands)
    .set({ imageUrl: url, updatedAt: new Date() })
    .where(eq(bands.id, bandId));
  return url;
}
