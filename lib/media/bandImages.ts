/**
 * Renseigne le visuel d'un groupe, par ordre de préférence.
 *
 * Le resolver média agrège déjà cette image à l'affichage, mais elle
 * n'était jamais persistée : les cartes de groupe, qui lisent
 * `bands.image_url`, affichaient donc toutes un monogramme.
 *
 * On stocke une URL vers l'image hébergée par Wikimedia, jamais une copie
 * du fichier — même principe que les pochettes.
 *
 * Ordre de préférence, du plus au moins souhaitable :
 *
 *   1. Wikidata P18 — photo du groupe, encyclopédique et librement
 *      licenciée ; c'est la seule source qui montre les musiciens ;
 *   2. Wikidata P154 — logo officiel, à défaut de photo ;
 *   3. Deezer — photo d'artiste de la plateforme, pour qu'aucune fiche ne
 *      reste sans visuel.
 *
 * N'écrase pas un visuel déjà renseigné : un choix éditorial local prime
 * sur la reprise automatique.
 */

import { db } from "@/db";
import { bands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getArtist, extractWikidataId } from "@/lib/providers/musicbrainz";
import { getEntityImageUrl, getEntityLogoUrl } from "@/lib/providers/wikidata";
import { findArtistPicture } from "@/lib/providers/deezer";

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
    .select({ imageUrl: bands.imageUrl, name: bands.name })
    .from(bands)
    .where(eq(bands.id, bandId))
    .limit(1);
  if (!existing) return null;
  if (existing.imageUrl) return existing.imageUrl;

  // Wikidata n'est atteignable qu'via l'identifiant porté par MusicBrainz
  const artist = await getArtist(artistMbid);
  const wikidataId = extractWikidataId(artist);

  let url: string | null = null;
  if (wikidataId) {
    url =
      (await getEntityImageUrl(wikidataId)) ??
      (await getEntityLogoUrl(wikidataId));
  }
  // Dernier recours : la plateforme, pour ne laisser aucune fiche nue
  url ??= await findArtistPicture(existing.name);
  if (!url) return null;

  await db
    .update(bands)
    .set({ imageUrl: url, updatedAt: new Date() })
    .where(eq(bands.id, bandId));
  return url;
}
