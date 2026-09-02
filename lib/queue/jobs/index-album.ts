/**
 * Jobs BullMQ d'indexation des albums dans Meilisearch.
 * `enqueueAlbumIndex` planifie un job (côté app Next.js) ;
 * `processAlbumIndex` l'exécute (côté worker) : ajout ou suppression
 * du document dans l'index "albums".
 */

// File dédiée aux jobs d'indexation des albums
import { albumIndexQueue } from "@/lib/queue/client";
// Relecture de l'album depuis la base au moment du traitement
import { getAlbumById } from "@/db/queries/albums";
// Client Meilisearch partagé
import { meilisearch } from "@/lib/search/meilisearch";
// Projection partagée avec la réindexation en masse (source unique)
import { albumDocument } from "@/lib/search/documents";
import { getBandById } from "@/db/queries/bands";

/** Charge utile du job : id de l'album + action à effectuer. */
export type AlbumIndexJobData = {
  albumId: string;
  action: "index" | "delete";
};

/**
 * Planifie l'indexation (ou la désindexation) d'un album.
 *
 * @param albumId - UUID de l'album concerné.
 * @param action - "index" (défaut) pour ajouter/mettre à jour,
 *                 "delete" pour retirer de l'index.
 * @returns Promesse résolue une fois le job ajouté à la file
 *          (3 tentatives, backoff exponentiel, échecs conservés).
 */
export async function enqueueAlbumIndex(
  albumId: string,
  action: "index" | "delete" = "index",
) {
  await albumIndexQueue.add(
    `album-${action}`,
    { albumId, action },
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
 * Traite un job d'indexation d'album : supprime le document si
 * action = "delete", sinon relit l'album en base et (ré)indexe ses
 * champs recherchables dans Meilisearch.
 *
 * @param data - Charge utile du job (albumId + action).
 */
export async function processAlbumIndex(data: AlbumIndexJobData) {
  if (data.action === "delete") {
    await meilisearch.index("albums").deleteDocument(data.albumId);
    console.log(`✅ Album ${data.albumId} supprimé de Meilisearch`);
    return;
  }

  const album = await getAlbumById(data.albumId);
  if (!album) {
    console.warn(`⚠️ Album ${data.albumId} introuvable`);
    return;
  }

  // Le document porte le contexte du groupe : c'est lui qui rend le
  // résultat de recherche cliquable vers l'URL band-scopée de l'album.
  const band = await getBandById(album.bandId);
  if (!band) {
    console.warn(`⚠️ Groupe ${album.bandId} introuvable, album non indexé`);
    return;
  }

  await meilisearch.index("albums").addDocuments([albumDocument(album, band)]);

  console.log(`✅ Album ${album.title} indexé dans Meilisearch`);
}
