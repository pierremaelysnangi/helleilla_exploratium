"use server";

/**
 * Server Actions CRUD pour les albums.
 * Chaque action vérifie les permissions RBAC, valide les données via zod,
 * persiste en base, gère la pochette (upload/suppression), déclenche
 * l'indexation asynchrone dans Meilisearch et invalide le cache Next.js.
 */

// Invalidation du cache des routes Next.js après mutation
import { revalidatePath } from "next/cache";
// Garde RBAC : lève une ActionError si la permission manque
import { requirePermission } from "@/lib/rbac/guards";
// Schémas de validation zod pour création / modification d'album
import { createAlbumSchema, updateAlbumSchema } from "@/lib/validations/album";
// Stockage des images : upload et suppression de la pochette
import { uploadImage, deleteImage } from "@/lib/storage/images";
// Mutations base de données (Drizzle) pour les albums
import { createAlbum, updateAlbum, deleteAlbum } from "@/db/mutations/albums";
// Requêtes de lecture pour vérifier l'existence des entités
import { getAlbumById } from "@/db/queries/albums";
import { getBandById } from "@/db/queries/bands";
// Gestion d'erreur commune + type de retour standard des actions
import { handleActionError, type ActionResult } from "./utils";
// Files BullMQ : indexation / suppression dans Meilisearch
import { enqueueAlbumIndex } from "@/lib/queue/jobs/index-album";
import { listTrackIdsByAlbumId } from "@/db/queries/tracks";
import { enqueueTrackIndex } from "@/lib/queue/jobs/index-track";

/**
 * Crée un album à partir d'un FormData.
 *
 * Vérifie la permission `album:create`, valide les champs via
 * `createAlbumSchema`, contrôle l'existence du groupe parent, upload
 * éventuellement la pochette puis persiste et planifie l'indexation.
 *
 * @param formData - Données du formulaire (champs album + fichier `cover`).
 * @returns ActionResult contenant l'album créé ou une erreur structurée.
 */
export async function createAlbumAction(
  formData: FormData,
): Promise<ActionResult<Awaited<ReturnType<typeof createAlbum>>>> {
  try {
    await requirePermission("album", "create");

    const raw = Object.fromEntries(formData.entries());
    const parsed = createAlbumSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    const band = await getBandById(parsed.data.bandId);
    if (!band) {
      return { success: false, error: "Groupe introuvable." };
    }

    let coverUrl: string | undefined;
    const coverFile = formData.get("cover");
    if (coverFile instanceof File && coverFile.size > 0) {
      coverUrl = await uploadImage(coverFile, "covers");
    }

    const album = await createAlbum({ ...parsed.data, coverUrl });

    // Déclenche l'indexation async
    await enqueueAlbumIndex(album.id, "index");

    revalidatePath(`/bands/${band.slug}`);
    revalidatePath("/albums");
    return { success: true, data: album };
  } catch (err) {
    return handleActionError(err);
  }
}

/**
 * Met à jour un album existant à partir d'un FormData.
 *
 * Vérifie la permission `album:update`, valide les champs, remplace
 * la pochette si un nouveau fichier est fourni (l'ancienne est supprimée),
 * puis persiste et planifie la réindexation.
 *
 * @param formData - Données du formulaire (dont `id` de l'album + `cover`).
 * @returns ActionResult contenant l'album mis à jour ou une erreur structurée.
 */
export async function updateAlbumAction(
  formData: FormData,
): Promise<ActionResult<Awaited<ReturnType<typeof updateAlbum>>>> {
  try {
    await requirePermission("album", "update");

    const raw = Object.fromEntries(formData.entries());
    const parsed = updateAlbumSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    const existing = await getAlbumById(parsed.data.id);
    if (!existing) {
      return { success: false, error: "Album introuvable." };
    }

    let coverUrl = existing.coverUrl;
    const coverFile = formData.get("cover");
    if (coverFile instanceof File && coverFile.size > 0) {
      if (existing.coverUrl) await deleteImage(existing.coverUrl);
      coverUrl = await uploadImage(coverFile, "covers");
    }

    const { id, ...data } = parsed.data;
    const album = await updateAlbum(id, { ...data, coverUrl });

    // Déclenche l'indexation async
    await enqueueAlbumIndex(album.id, "index");

    revalidatePath("/albums");
    revalidatePath(`/albums/${album.slug}`);
    return { success: true, data: album };
  } catch (err) {
    return handleActionError(err);
  }
}

/**
 * Supprime un album (et sa pochette) par identifiant.
 *
 * Vérifie la permission `album:delete`, collecte les pistes AVANT la
 * suppression en cascade afin de les retirer aussi de l'index de
 * recherche, puis invalide le cache.
 *
 * @param id - UUID de l'album à supprimer.
 * @returns ActionResult contenant `{ id }` ou une erreur structurée.
 */
export async function deleteAlbumAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("album", "delete");

    // Récupérer les tracks AVANT la suppression cascade
    const trackIds = await listTrackIdsByAlbumId(id);

    const existing = await getAlbumById(id);
    if (!existing) {
      return { success: false, error: "Album introuvable." };
    }

    if (existing.coverUrl) await deleteImage(existing.coverUrl);
    await deleteAlbum(id);

    // Supprime de l'index
    await enqueueAlbumIndex(id, "delete");
    await Promise.all(
      trackIds.map((trackId) => enqueueTrackIndex(trackId, "delete")),
    );

    revalidatePath("/albums");
    return { success: true, data: { id } };
  } catch (err) {
    return handleActionError(err);
  }
}
