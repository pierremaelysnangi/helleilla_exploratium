"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { can } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/rbac/roles";
import { createBandSchema, updateBandSchema } from "@/lib/validations/band";
import { uploadImage, deleteImage } from "@/lib/storage/images";
import { createBand, updateBand, deleteBand } from "@/db/mutations/bands";
import { getBandById } from "@/db/queries/bands";  
import { enqueueBandIndex } from "@/lib/queue/jobs/index-band";
import { handleActionError } from "./utils";
import { listAlbumIdsByBandId } from "@/db/queries/albums";
import { listTrackIdsByAlbumIds } from "@/db/queries/tracks";
import { enqueueAlbumIndex } from "@/lib/queue/jobs/index-album";
import { enqueueTrackIndex } from "@/lib/queue/jobs/index-track";

class ActionError extends Error {}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ActionError("Non authentifié.");
  return session;
}

function assertPermission(
  role: Role,
  action: "create" | "update" | "delete",
  resource: "band"
) {
  if (!can(role, resource, action)) {
    throw new ActionError("Permission refusée.");
  }
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string | Record<string, unknown> };

export async function createBandAction(
  formData: FormData
): Promise<ActionResult<Awaited<ReturnType<typeof createBand>>>> {
  try {
    const session = await requireSession();
    const role = session.user.role as Role;
    assertPermission(role, "create", "band");

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
    return handleActionError(err);
  }
}

export async function updateBandAction(
  formData: FormData
): Promise<ActionResult<Awaited<ReturnType<typeof updateBand>>>> {
  try {
    const session = await requireSession();
    const role = session.user.role as Role;
    assertPermission(role, "update", "band");

    const raw = Object.fromEntries(formData.entries());
    const parsed = updateBandSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    const existing = await getBandById(parsed.data.id);
    if (!existing) {
      return { success: false, error: "Groupe introuvable." };
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
    return handleActionError(err);
  }
}

export async function deleteBandAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const role = session.user.role as Role;
    assertPermission(role, "delete", "band");

    // 1. Collecter toute la descendance AVANT suppression
    const albumIds = await listAlbumIdsByBandId(id);
    const trackIds = await listTrackIdsByAlbumIds(albumIds);

    const existing = await getBandById(id);
    if (!existing) {
      return { success: false, error: "Groupe introuvable." };
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
    return handleActionError(err);
  }
}