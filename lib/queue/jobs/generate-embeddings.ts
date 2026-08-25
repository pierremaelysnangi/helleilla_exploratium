/**
 * Jobs BullMQ de génération d'embeddings sémantiques pour les groupes.
 * `enqueueEmbeddings` planifie un job (côté app Next.js) après une
 * création/modification ; `processEmbeddings` l'exécute (côté worker) :
 * appel du service d'embeddings (Ollama local par défaut) puis
 * persistance du vecteur dans la colonne pgvector `bands.embedding`.
 *
 * L'échec est non bloquant pour l'application : le job est retenté
 * (2 tentatives) et conservé en échec pour diagnostic.
 */

// File dédiée aux jobs d'embeddings
import { embeddingsQueue } from "@/lib/queue/client";
// Variables validées : URL + modèle du service d'embeddings
import { env } from "@/lib/env";
// Persistance du vecteur dans la table bands
import { db } from "@/db";
import { bands } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Charge utile du job : groupe cible + texte à vectoriser. */
export type EmbeddingsJobData = {
  bandId: string;
  text: string;
};

/** Dimension attendue du vecteur (doit correspondre à la colonne pgvector). */
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Construit le texte à vectoriser depuis les champs textuels d'un groupe.
 * Centralisé ici pour garantir un contenu homogène entre create/update.
 *
 * @param band - Groupe lu en base (champs optionnels tolérés).
 * @returns Texte concaténé prêt pour l'embedding.
 */
export function buildBandEmbeddingText(band: {
  name: string;
  bio?: string | null;
  countryCode?: string | null;
}): string {
  return [band.name, band.countryCode, band.bio]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000); // garde-fou : pas besoin de plus pour une bio
}

/**
 * Planifie la génération d'un embedding pour un groupe.
 * Fire-and-forget : ne doit jamais faire échouer la requête appelante.
 *
 * @param bandId - UUID du groupe.
 * @param text - Texte à vectoriser (voir buildBandEmbeddingText).
 */
export async function enqueueEmbeddings(bandId: string, text: string) {
  await embeddingsQueue.add(
    "generate-embeddings",
    { bandId, text },
    {
      attempts: 2,
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

/**
 * Traite un job d'embedding : appelle le service Ollama (`/api/embed`),
 * valide la dimension du vecteur puis l'écrit dans `bands.embedding`.
 *
 * @param data - Charge utile du job (bandId + text).
 * @throws Si le service d'embeddings échoue -> BullMQ retente.
 */
export async function processEmbeddings(data: EmbeddingsJobData) {
  const res = await fetch(`${env.EMBEDDINGS_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: env.EMBEDDINGS_MODEL, input: data.text }),
  });
  if (!res.ok) {
    throw new Error(
      `Service d'embeddings HTTP ${res.status} (${env.EMBEDDINGS_BASE_URL})`,
    );
  }

  const payload = (await res.json()) as { embeddings?: number[][] };
  const vector = payload.embeddings?.[0];
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    // Vecteur inattendu : inutile de retenter, on journalise et on abandonne
    console.error(
      `[embeddings] Dimension inattendue (${vector?.length ?? "n/a"} ≠ ${EMBEDDING_DIMENSIONS}) pour band ${data.bandId}`,
    );
    return;
  }

  // La colonne pgvector Drizzle attend number[] : la sérialisation en
  // littéral "[0.1,...]" est gérée par le mapper du driver
  await db
    .update(bands)
    .set({ embedding: vector, updatedAt: new Date() })
    .where(eq(bands.id, data.bandId));

  console.log(`✅ Embedding généré pour band ${data.bandId}`);
}
