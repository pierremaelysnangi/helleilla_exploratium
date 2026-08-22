"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac/guards";
import { createGenreSchema, updateGenreSchema } from "@/lib/validations/genre";
import { createGenre, updateGenre, deleteGenre } from "@/db/mutations/genres";
import { getGenreById } from "@/db/queries/genres";
import { handleActionError, type ActionResult } from "./utils";

export async function createGenreAction(
  formData: FormData
): Promise<ActionResult<Awaited<ReturnType<typeof createGenre>>>> {
  try {
    await requirePermission("genre", "create");

    const raw = Object.fromEntries(formData.entries());
    const parsed = createGenreSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    const genre = await createGenre(parsed.data);
    revalidatePath("/genres");
    return { success: true, data: genre };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateGenreAction(
  formData: FormData
): Promise<ActionResult<Awaited<ReturnType<typeof updateGenre>>>> {
  try {
    await requirePermission("genre", "update");

    const raw = Object.fromEntries(formData.entries());
    const parsed = updateGenreSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    const existing = await getGenreById(parsed.data.id);
    if (!existing) {
      return { success: false, error: "Genre introuvable." };
    }

    const { id, ...data } = parsed.data;
    const genre = await updateGenre(id, data);

    revalidatePath("/genres");
    revalidatePath(`/genres/${genre.slug}`);
    if (existing.slug !== genre.slug) revalidatePath(`/genres/${existing.slug}`);

    return { success: true, data: genre };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteGenreAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("genre", "delete");

    const existing = await getGenreById(id);
    if (!existing) {
      return { success: false, error: "Genre introuvable." };
    }

    await deleteGenre(id);

    revalidatePath("/genres");
    revalidatePath(`/genres/${existing.slug}`);
    return { success: true, data: { id } };
  } catch (err) {
    return handleActionError(err);
  }
}