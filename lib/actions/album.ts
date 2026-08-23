"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac/guards";
import { createAlbumSchema, updateAlbumSchema } from "@/lib/validations/album";
import { uploadImage, deleteImage } from "@/lib/storage/images";
import { createAlbum, updateAlbum, deleteAlbum } from "@/db/mutations/albums";
import { getAlbumById } from "@/db/queries/albums";
import { getBandById } from "@/db/queries/bands";
import { handleActionError, type ActionResult } from "./utils";
import { enqueueAlbumIndex } from "@/lib/queue/jobs/index-album";
import { listTrackIdsByAlbumId } from "@/db/queries/tracks";
import { enqueueTrackIndex } from "@/lib/queue/jobs/index-track";

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
