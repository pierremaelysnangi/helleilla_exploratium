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
  if (!can(role, action, resource)) {
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

    revalidatePath("/bands");
    return { success: true, data: band };
  } catch (err) {
    if (err instanceof ActionError) return { success: false, error: err.message };
    console.error(err);
    return { success: false, error: "Erreur serveur inattendue." };
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

    revalidatePath("/bands");
    revalidatePath(`/bands/${band.slug}`);
    return { success: true, data: band };
  } catch (err) {
    if (err instanceof ActionError) return { success: false, error: err.message };
    console.error(err);
    return { success: false, error: "Erreur serveur inattendue." };
  }
}

export async function deleteBandAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const role = session.user.role as Role;
    assertPermission(role, "delete", "band");

    const existing = await getBandById(id);
    if (!existing) {
      return { success: false, error: "Groupe introuvable." };
    }

    if (existing.imageUrl) await deleteImage(existing.imageUrl);
    await deleteBand(id);

    revalidatePath("/bands");
    return { success: true, data: { id } };
  } catch (err) {
    if (err instanceof ActionError) return { success: false, error: err.message };
    console.error(err);
    return { success: false, error: "Erreur serveur inattendue." };
  }
}