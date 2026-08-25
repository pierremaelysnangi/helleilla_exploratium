/**
 * Jobs BullMQ d'indexation des groupes dans Meilisearch.
 * `enqueueBandIndex` planifie un job (côté app Next.js) ;
 * `processBandIndex` l'exécute (côté worker) : ajout ou suppression
 * du document dans l'index "bands".
 */

// File dédiée aux jobs d'indexation des groupes
import { bandIndexQueue } from "@/lib/queue/client";
// Relecture du groupe depuis la base au moment du traitement
import { getBandById } from "@/db/queries/bands";
// Client Meilisearch partagé
import { meilisearch } from "@/lib/search/meilisearch";

/** Charge utile du job : id du groupe + action à effectuer. */
export type BandIndexJobData = {
  bandId: string;
  action: "index" | "delete";
};

/**
 * Planifie l'indexation (ou la désindexation) d'un groupe.
 *
 * @param bandId - UUID du groupe concerné.
 * @param action - "index" (défaut) pour ajouter/mettre à jour,
 *                 "delete" pour retirer de l'index.
 * @returns Promesse résolue une fois le job ajouté à la file
 *          (3 tentatives, backoff exponentiel, échecs conservés).
 */
export async function enqueueBandIndex(
  bandId: string,
  action: "index" | "delete" = "index",
) {
  await bandIndexQueue.add(
    `band-${action}`,
    { bandId, action },
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
 * Traite un job d'indexation de groupe : supprime le document si
 * action = "delete", sinon relit le groupe en base et (ré)indexe ses
 * champs recherchables dans Meilisearch.
 *
 * @param data - Charge utile du job (bandId + action).
 */
export async function processBandIndex(data: BandIndexJobData) {
  if (data.action === "delete") {
    await meilisearch.index("bands").deleteDocument(data.bandId);
    console.log(`✅ Band ${data.bandId} supprimé de Meilisearch`);
    return;
  }

  const band = await getBandById(data.bandId);
  if (!band) {
    console.warn(`⚠️ Band ${data.bandId} introuvable`);
    return;
  }

  await meilisearch.index("bands").addDocuments([
    {
      id: band.id,
      name: band.name,
      slug: band.slug,
      bio: band.bio,
      countryCode: band.countryCode,
      formedYear: band.formedYear,
    },
  ]);

  console.log(`✅ Band ${band.name} indexé dans Meilisearch`);
}
