"use server";

/**
 * Server Actions CRUD pour les genres.
 * Entité simple (pas de fichier ni d'indexation) : vérification RBAC,
 * validation zod, persistance Drizzle et invalidation du cache Next.js.
 */

// Invalidation du cache des routes Next.js après mutation
import { revalidatePath } from "next/cache";
// Garde RBAC : lève une ActionError si la permission manque
import { requirePermission } from "@/lib/rbac/guards";
// Schémas de validation zod pour création / modification de genre
import { createGenreSchema, updateGenreSchema } from "@/lib/validations/genre";
// Mutations base de données (Drizzle) pour les genres
import { createGenre, updateGenre, deleteGenre } from "@/db/mutations/genres";
// Requête de lecture : existence d'un genre par id
import { getGenreById } from "@/db/queries/genres";
// Gestion d'erreur commune + type de retour standard des actions
import { handleActionError, type ActionResult } from "./utils";

/**
 * Crée un genre à partir d'un FormData.
 *
 * Vérifie la permission `genre:create`, valide les champs via
 * `createGenreSchema` puis persiste.
 *
 * @param formData - Données du formulaire (`name`, `slug`).
 * @returns ActionResult contenant le genre créé ou une erreur structurée.
 */
export async function createGenreAction(
  formData: FormData,
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

/**
 * Met à jour un genre existant à partir d'un FormData.
 *
 * Vérifie la permission `genre:update`, valide les champs, contrôle
 * l'existence du genre et invalide aussi l'ancienne URL si le slug change.
 *
 * @param formData - Données du formulaire (dont `id` du genre).
 * @returns ActionResult contenant le genre mis à jour ou une erreur structurée.
 */
export async function updateGenreAction(
  formData: FormData,
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
    if (existing.slug !== genre.slug)
      revalidatePath(`/genres/${existing.slug}`);

    return { success: true, data: genre };
  } catch (err) {
    return handleActionError(err);
  }
}

/**
 * Supprime un genre par identifiant.
 *
 * Vérifie la permission `genre:delete` (réservée à l'admin), contrôle
 * l'existence du genre puis supprime et invalide le cache.
 *
 * @param id - UUID du genre à supprimer.
 * @returns ActionResult contenant `{ id }` ou une erreur structurée.
 */
export async function deleteGenreAction(
  id: string,
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
