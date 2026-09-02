/**
 * Approbation d'une contribution : l'étape qui transforme un dossier
 * validé en données réelles de l'encyclopédie.
 *
 * Jusqu'ici l'approbation ne faisait que basculer le statut : aucun
 * groupe n'était créé, `payload.refs` était validé puis jamais consommé,
 * et la promotion des médias n'était atteignable que pour `band_update`
 * (la garde exigeait `targetBandId`, champ propre à ce type). Le workflow
 * ne produisait donc aucune donnée.
 *
 * Ordre des opérations, choisi pour être REJOUABLE : un échec MinIO
 * laisse le dossier non approuvé, et une seconde tentative doit aboutir
 * au même résultat plutôt que d'échouer sur un conflit de slug.
 *
 * 1. résoudre le groupe cible (réutilisé s'il existe déjà, sinon créé) ;
 * 2. synchroniser les références externes du payload ;
 * 3. promouvoir les médias staging -> public et rattacher la première
 *    image au groupe ;
 * 4. réindexer, puis seulement alors marquer le dossier approuvé.
 */

// Accès données
import { getBandBySlug } from "@/db/queries/bands";
import { createBand, updateBand } from "@/db/mutations/bands";
import { setExternalRefs } from "@/db/mutations/externalRefs";
import { updateStatus } from "@/db/mutations/contributions";
import type { ContributionRow } from "@/db/queries/contributions";
// Promotion des médias MinIO
import { promoteContributionFiles } from "@/lib/storage/contributions";
// Réindexation Meilisearch + embeddings sémantiques
import { enqueueBandIndex } from "@/lib/queue/jobs/index-band";
import {
  enqueueEmbeddings,
  buildBandEmbeddingText,
} from "@/lib/queue/jobs/generate-embeddings";
// Erreur typée convertie en réponse HTTP par le pipeline route()
import { ApiError } from "@/lib/api/response";

/** Fournisseurs acceptés dans `payload.refs` (sous-ensemble de l'enum). */
type RefProvider = "musicbrainz" | "discogs" | "wikidata";

/**
 * Forme du payload stocké : champs du groupe (validés à la soumission par
 * `contributionPayloadSchema`) plus `targetBandId` injecté par la route.
 */
type ContributionPayload = {
  name: string;
  slug: string;
  bio?: string | null;
  countryCode?: string | null;
  formedYear?: number | null;
  dissolvedYear?: number | null;
  refs?: { provider: RefProvider; externalId: string }[];
  targetBandId?: string | null;
};

/** Champs du groupe extraits du payload, sans les métadonnées du dossier. */
function bandFieldsFrom(payload: ContributionPayload) {
  return {
    name: payload.name,
    slug: payload.slug,
    bio: payload.bio ?? null,
    countryCode: payload.countryCode ?? null,
    formedYear: payload.formedYear ?? null,
    dissolvedYear: payload.dissolvedYear ?? null,
  };
}

/**
 * Résout le groupe visé par la contribution.
 *
 * Pour `band_update`, c'est `targetBandId`. Pour `band_create`, on
 * réutilise un groupe portant déjà le slug soumis : c'est ce qui rend
 * l'approbation rejouable après un échec de promotion MinIO, plutôt que
 * de buter sur la contrainte d'unicité du slug.
 */
async function resolveTargetBand(
  contribution: ContributionRow,
  payload: ContributionPayload,
): Promise<{ id: string; created: boolean }> {
  if (contribution.type === "band_update") {
    if (!payload.targetBandId) {
      throw new ApiError(
        "VALIDATION",
        "Contribution band_update sans groupe cible : dossier incohérent",
      );
    }
    const updated = await updateBand(
      payload.targetBandId,
      bandFieldsFrom(payload),
    );
    if (!updated) {
      throw new ApiError("NOT_FOUND", "Le groupe à enrichir n'existe plus");
    }
    return { id: updated.id, created: false };
  }

  const existing = await getBandBySlug(payload.slug);
  if (existing) return { id: existing.id, created: false };

  const band = await createBand(bandFieldsFrom(payload));
  return { id: band.id, created: true };
}

/**
 * Applique l'approbation d'une contribution de bout en bout.
 *
 * @param contribution - Le dossier à approuver (déjà lu par la route).
 * @param reviewerId - Identifiant du modérateur qui approuve.
 * @returns Le dossier mis à jour et l'identifiant du groupe concerné.
 * @throws ApiError si le dossier est incohérent ou si le stockage échoue.
 */
export async function approveContribution(
  contribution: ContributionRow,
  reviewerId: string,
): Promise<{ contribution: ContributionRow | null; bandId: string }> {
  const payload = contribution.payload as ContributionPayload;

  // 1. Groupe cible : créé, réutilisé ou enrichi
  const { id: bandId } = await resolveTargetBand(contribution, payload);

  // 2. Références officielles déclarées à la soumission — c'est la preuve
  //    matérialisée : sans elles le dossier n'aurait pas été recevable.
  if (payload.refs && payload.refs.length > 0) {
    await setExternalRefs("band", bandId, payload.refs);
  }

  // 3. Médias : staging privé -> espace public du groupe
  let promotedKeys: string[] = [];
  try {
    ({ promotedKeys } = await promoteContributionFiles(
      contribution.id,
      bandId,
    ));
  } catch (err) {
    console.error("[contributions] Promotion MinIO échouée:", err);
    throw new ApiError(
      "UNAVAILABLE",
      "Stockage indisponible : approbation non finalisée, réessayez",
    );
  }

  // La première image promue devient le visuel du groupe. Sans cette
  // étape, les fichiers étaient déplacés puis jamais référencés.
  const firstImage = promotedKeys.find((key) => /\.(jpg|png|webp)$/i.test(key));
  if (firstImage) {
    await updateBand(bandId, { imageUrl: firstImage });
  }

  // 4. Rendre le groupe trouvable, puis clore le dossier
  await enqueueBandIndex(bandId, "index");
  await enqueueEmbeddings(
    bandId,
    buildBandEmbeddingText({ name: payload.name }),
  );

  const updated = await updateStatus(contribution.id, "approved", reviewerId);
  return { contribution: updated, bandId };
}
