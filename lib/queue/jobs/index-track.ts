/**
 * Jobs BullMQ d'indexation des pistes dans Meilisearch.
 * `enqueueTrackIndex` planifie un job (côté app Next.js) ;
 * `processTrackIndex` l'exécute (côté worker) : ajout ou suppression
 * du document dans l'index "tracks".
 */

// File dédiée aux jobs d'indexation des pistes
import { trackIndexQueue } from "@/lib/queue/client";
// Relecture de la piste depuis la base au moment du traitement
import { getTrackWithAlbum } from "@/db/queries/tracks";
// Client Meilisearch partagé
import { meilisearch } from "@/lib/search/meilisearch";
// Projection partagée avec la réindexation en masse (source unique)
import { trackDocument } from "@/lib/search/documents";

/** Charge utile du job : id de la piste + action à effectuer. */
export type TrackIndexJobData = {
  trackId: string;
  action: "index" | "delete";
};

/**
 * Planifie l'indexation (ou la désindexation) d'une piste.
 *
 * @param trackId - UUID de la piste concernée.
 * @param action - "index" (défaut) pour ajouter/mettre à jour,
 *                 "delete" pour retirer de l'index.
 * @returns Promesse résolue une fois le job ajouté à la file
 *          (3 tentatives, backoff exponentiel, échecs conservés).
 */
export async function enqueueTrackIndex(
  trackId: string,
  action: "index" | "delete" = "index",
) {
  await trackIndexQueue.add(
    `track-${action}`,
    { trackId, action },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

/**
 * Traite un job d'indexation de piste : supprime le document si
 * action = "delete", sinon relit la piste en base et (ré)indexe ses
 * champs recherchables dans Meilisearch.
 *
 * @param data - Charge utile du job (trackId + action).
 */
export async function processTrackIndex(data: TrackIndexJobData) {
  if (data.action === "delete") {
    await meilisearch.index("tracks").deleteDocument(data.trackId);
    console.log(`✅ Track ${data.trackId} supprimé de Meilisearch`);
    return;
  }

  // `getTrackWithAlbum` remonte l'album ET son groupe : le document
  // indexé doit porter de quoi construire un lien et afficher une
  // pochette, qu'un identifiant seul ne permet pas.
  const track = await getTrackWithAlbum(data.trackId);
  if (!track) {
    console.warn(`⚠️ Track ${data.trackId} introuvable`);
    return;
  }

  await meilisearch
    .index("tracks")
    .addDocuments([trackDocument(track, track.album, track.album.band)]);

  console.log(`✅ Track ${track.title} indexé dans Meilisearch`);
}
