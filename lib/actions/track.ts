"use server";

/**
 * Server Actions CRUD pour les pistes (tracks).
 * Vérification RBAC, validation zod, contrôle du parent album,
 * persistance Drizzle, indexation Meilisearch asynchrone et
 * invalidation du cache Next.js.
 */

// Invalidation du cache des routes Next.js après mutation
import { revalidatePath } from "next/cache";
// Garde RBAC : lève une ActionError si la permission manque
import { requirePermission } from "@/lib/rbac/guards";
// Schémas de validation zod pour création / modification de piste
import { createTrackSchema, updateTrackSchema } from "@/lib/validations/track";
// Mutations base de données (Drizzle) pour les pistes
import { createTrack, updateTrack, deleteTrack } from "@/db/mutations/tracks";
// Requêtes de lecture : existence album / piste (avec album joint)
import { getTrackWithAlbum } from "@/db/queries/tracks";
import { getAlbumById } from "@/db/queries/albums";
// Gestion d'erreur commune + type de retour standard des actions
import { handleActionError, type ActionResult } from "./utils";
// File BullMQ : indexation / suppression dans Meilisearch
import { enqueueTrackIndex } from "@/lib/queue/jobs/index-track";

/**
 * Crée une piste à partir d'un FormData.
 *
 * Vérifie la permission `track:create`, valide les champs via
 * `createTrackSchema`, contrôle l'existence de l'album parent puis
 * persiste et planifie l'indexation.
 *
 * @param formData - Données du formulaire (`albumId`, `title`, `trackNumber`...).
 * @returns ActionResult contenant la piste créée ou une erreur structurée.
 */
export async function createTrackAction(
  formData: FormData,
): Promise<ActionResult<Awaited<ReturnType<typeof createTrack>>>> {
  try {
    await requirePermission("track", "create");

    const raw = Object.fromEntries(formData.entries());
    const parsed = createTrackSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    // Vérifier que l'album existe
    const album = await getAlbumById(parsed.data.albumId);
    if (!album) {
      return { success: false, error: "Album introuvable." };
    }

    const track = await createTrack(parsed.data);

    // Déclenche l'indexation async
    await enqueueTrackIndex(track.id, "index");

    revalidatePath(`/albums/${album.slug}`);
    revalidatePath("/albums");
    return { success: true, data: track };
  } catch (err) {
    return handleActionError(err);
  }
}

/**
 * Met à jour une piste existante à partir d'un FormData.
 *
 * Vérifie la permission `track:update`, valide les champs, contrôle
 * l'existence de la piste (avec son album pour l'invalidation du cache),
 * puis persiste et planifie la réindexation.
 *
 * @param formData - Données du formulaire (dont `id` de la piste).
 * @returns ActionResult contenant la piste mise à jour ou une erreur structurée.
 */
export async function updateTrackAction(
  formData: FormData,
): Promise<ActionResult<Awaited<ReturnType<typeof updateTrack>>>> {
  try {
    await requirePermission("track", "update");

    const raw = Object.fromEntries(formData.entries());
    const parsed = updateTrackSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    const existing = await getTrackWithAlbum(parsed.data.id);
    if (!existing) {
      return { success: false, error: "Piste introuvable." };
    }

    const { id, ...data } = parsed.data;
    const track = await updateTrack(id, data);

    // Déclenche l'indexation async
    await enqueueTrackIndex(track.id, "index");

    revalidatePath(`/albums/${existing.album.slug}`);
    revalidatePath("/albums");
    return { success: true, data: track };
  } catch (err) {
    return handleActionError(err);
  }
}

/**
 * Supprime une piste par identifiant.
 *
 * Vérifie la permission `track:delete`, contrôle l'existence de la piste
 * (avec son album pour l'invalidation du cache), supprime puis planifie
 * la désindexation.
 *
 * @param id - UUID de la piste à supprimer.
 * @returns ActionResult contenant `{ id }` ou une erreur structurée.
 */
export async function deleteTrackAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("track", "delete");

    const existing = await getTrackWithAlbum(id);
    if (!existing) {
      return { success: false, error: "Piste introuvable." };
    }

    await deleteTrack(id);

    // Déclenche l'indexation async
    await enqueueTrackIndex(id, "delete");

    revalidatePath(`/albums/${existing.album.slug}`);
    revalidatePath("/albums");
    return { success: true, data: { id } };
  } catch (err) {
    return handleActionError(err);
  }
}
