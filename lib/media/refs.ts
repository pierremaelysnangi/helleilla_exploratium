/**
 * Écriture des références externes d'un album.
 *
 * Isolé dans son propre module parce que DEUX chemins y écrivent — la
 * résolution des pochettes et l'import de discographie — et qu'ils
 * doivent respecter la même contrainte, faute de quoi l'un fonctionne et
 * l'autre échoue sur les mêmes données.
 */

import { db } from "@/db";
import { externalRefs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Rattache un album à son release-group MusicBrainz.
 *
 * C'est cette référence qui rend la sortie résolvable ensuite : sans
 * elle, ni pochette ni tracklist ne peuvent être retrouvées.
 *
 * Deux index uniques encadrent la table, et la clause `ON CONFLICT` ne
 * peut en viser qu'un :
 *
 * - `external_refs_entity_provider_idx` sur `(entityType, entityId,
 *   provider)` — traité par la clause, une entité change simplement de
 *   référence ;
 * - `external_refs_provider_external_idx` sur `(provider, externalId)` —
 *   traité par le contrôle préalable ci-dessous. Un identifiant amont ne
 *   désigne qu'une entité locale ; tenter de le déplacer levait une
 *   erreur qui faisait échouer toute la passe du groupe.
 *
 * Idempotente : rejouable sans effet de bord.
 *
 * @returns `true` si la référence est en place, `false` si l'identifiant
 *   appartient déjà à une AUTRE entité — cas signalé, jamais forcé.
 */
export async function linkAlbumToReleaseGroup(
  albumId: string,
  releaseGroupMbid: string,
): Promise<boolean> {
  const [holder] = await db
    .select({ entityId: externalRefs.entityId })
    .from(externalRefs)
    .where(
      and(
        eq(externalRefs.provider, "musicbrainz"),
        eq(externalRefs.externalId, releaseGroupMbid),
      ),
    )
    .limit(1);

  if (holder && holder.entityId !== albumId) return false;

  await db
    .insert(externalRefs)
    .values({
      entityType: "album",
      entityId: albumId,
      provider: "musicbrainz",
      externalId: releaseGroupMbid,
    })
    .onConflictDoUpdate({
      target: [
        externalRefs.entityType,
        externalRefs.entityId,
        externalRefs.provider,
      ],
      set: { externalId: releaseGroupMbid, updatedAt: new Date() },
    });

  return true;
}
