"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac/guards";
import { createTrackSchema, updateTrackSchema } from "@/lib/validations/track";
import { createTrack, updateTrack, deleteTrack } from "@/db/mutations/tracks";
import { getTrackWithAlbum } from "@/db/queries/tracks";
import { getAlbumById } from "@/db/queries/albums";
import { handleActionError, type ActionResult } from "./utils";
import { enqueueTrackIndex } from "@/lib/queue/jobs/index-track";

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
