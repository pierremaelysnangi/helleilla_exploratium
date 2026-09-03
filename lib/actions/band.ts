"use server";

/**
 * Server Actions CRUD pour les groupes (bands).
 * Même structure que album.ts : vérification RBAC, validation zod,
 * gestion du logo, persistance Drizzle, indexation Meilisearch asynchrone
 * et invalidation du cache Next.js.
 */

// Invalidation du cache des routes Next.js après mutation
import { revalidatePath } from "next/cache";
// Schémas de validation zod pour création / modification de groupe
import { createBandSchema, updateBandSchema } from "@/lib/validations/band";
// Stockage des images : upload et suppression du logo
import { uploadImage, deleteImage } from "@/lib/storage/images";
// Mutations base de données (Drizzle) pour les groupes
import { createBand, updateBand, deleteBand } from "@/db/mutations/bands";
// Requête de lecture : existence d'un groupe par id
import { getBandById } from "@/db/queries/bands";
// File BullMQ : indexation / suppression dans Meilisearch
import { enqueueBandIndex } from "@/lib/queue/jobs/index-band";
// Garde RBAC : lève une ActionError si la permission manque
import { requirePermission } from "@/lib/rbac/guards";
// Gestion d'erreur commune + type de retour standard des actions
import { handleActionError, type ActionResult } from "./utils";
// Requêtes utilisées pour collecter la descendance avant suppression cascade
import { listAlbumIdsByBandId } from "@/db/queries/albums";
import { listTrackIdsByAlbumIds } from "@/db/queries/tracks";
// Files BullMQ des entités enfants (désindexation en cascade)
import { enqueueAlbumIndex } from "@/lib/queue/jobs/index-album";
import { enqueueTrackIndex } from "@/lib/queue/jobs/index-track";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Crée un groupe à partir d'un FormData.
 *
 * Vérifie la permission `band:create`, valide les champs via
 * `createBandSchema`, upload éventuellement le logo puis persiste
 * et planifie l'indexation.
 *
 * @param formData - Données du formulaire (champs groupe + fichier `image`).
 * @returns ActionResult contenant le groupe créé ou une erreur structurée.
 */
export async function createBandAction(
  formData: FormData,
): Promise<ActionResult<Awaited<ReturnType<typeof createBand>>>> {
  try {
    await requirePermission("band", "create");

    const raw = Object.fromEntries(formData.entries());
    const parsed = createBandSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    let imageUrl: string | null = null;
    const imageFile = formData.get("image");
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile, "logos");
    }

    const band = await createBand({ ...parsed.data, imageUrl });

    // Déclenche l'indexation async
    await enqueueBandIndex(band.id, "index");

    revalidatePath("/bands");
    return { success: true, data: band };
  } catch (err) {
    return await handleActionError(err);
  }
}

/**
 * Met à jour un groupe existant à partir d'un FormData.
 *
 * Vérifie la permission `band:update`, valide les champs, remplace le
 * logo si un nouveau fichier est fourni (l'ancien est supprimé), puis
 * persiste et planifie la réindexation.
 *
 * @param formData - Données du formulaire (dont `id` du groupe + `image`).
 * @returns ActionResult contenant le groupe mis à jour ou une erreur structurée.
 */
export async function updateBandAction(
  formData: FormData,
): Promise<ActionResult<Awaited<ReturnType<typeof updateBand>>>> {
  try {
    await requirePermission("band", "update");

    const raw = Object.fromEntries(formData.entries());
    const parsed = updateBandSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    const existing = await getBandById(parsed.data.id);
    if (!existing) {
      const { t } = await getTranslations();
      return { success: false, error: t.errors.bandNotFound };
    }

    let imageUrl = existing.imageUrl;
    const imageFile = formData.get("image");
    if (imageFile instanceof File && imageFile.size > 0) {
      if (existing.imageUrl) await deleteImage(existing.imageUrl);
      imageUrl = await uploadImage(imageFile, "logos");
    }

    const { id, ...data } = parsed.data;
    const band = await updateBand(id, { ...data, imageUrl });

    // Re-indexe le band modifié
    await enqueueBandIndex(band.id, "index");

    revalidatePath("/bands");
    revalidatePath(`/bands/${band.slug}`);
    return { success: true, data: band };
  } catch (err) {
    return await handleActionError(err);
  }
}

/**
 * Supprime un groupe, son logo et toute sa descendance (albums + pistes).
 *
 * Vérifie la permission `band:delete`, collecte les ids d'albums et de
 * pistes AVANT la suppression en cascade afin de les désindexer aussi
 * de Meilisearch, puis invalide le cache.
 *
 * @param id - UUID du groupe à supprimer.
 * @returns ActionResult contenant `{ id }` ou une erreur structurée.
 */
export async function deleteBandAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("band", "delete");

    // 1. Collecter toute la descendance AVANT suppression
    const albumIds = await listAlbumIdsByBandId(id);
    const trackIds = await listTrackIdsByAlbumIds(albumIds);

    const existing = await getBandById(id);
    if (!existing) {
      const { t } = await getTranslations();
      return { success: false, error: t.errors.bandNotFound };
    }

    if (existing.imageUrl) await deleteImage(existing.imageUrl);
    await deleteBand(id);

    // Supprime de l'index
    await enqueueBandIndex(id, "delete");
    await Promise.all([
      ...albumIds.map((aid) => enqueueAlbumIndex(aid, "delete")),
      ...trackIds.map((tid) => enqueueTrackIndex(tid, "delete")),
    ]);

    revalidatePath("/bands");
    revalidatePath(`/bands/${existing.slug}`);
    return { success: true, data: { id } };
  } catch (err) {
    return await handleActionError(err);
  }
}
