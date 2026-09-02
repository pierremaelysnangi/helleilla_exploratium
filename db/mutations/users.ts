/**
 * @file Mutations (écritures) sur les comptes utilisateurs.
 *
 * ⚠️ Ces écritures traversent les DEUX bases : la source de vérité est la
 * base identité (`authDb`), et la base contenu porte une projection
 * publique (`profiles`) utilisée pour les jointures locales.
 *
 * Les hooks Better Auth (`databaseHooks.user.update.after`) ne se
 * déclenchent que sur les écritures passant par son API. Une écriture
 * Drizzle directe DOIT donc synchroniser `profiles` explicitement, sans
 * quoi le rôle affiché publiquement diverge du rôle réellement appliqué.
 * `scripts/seed-admin.ts` suit déjà exactement ce protocole.
 */

// Base identité (source de vérité) et base contenu (projection)
import { authDb } from "@/lib/auth-db";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AdminUser, UserRow } from "@/db/queries/users";

/** Champs modifiables par un administrateur. */
export type UserAdminPatch = {
  role?: UserRow["role"];
  banned?: boolean;
  banReason?: string | null;
};

/**
 * Met à jour un compte et synchronise sa projection publique.
 *
 * @param id - Identifiant Better Auth du compte.
 * @param patch - Champs à modifier (rôle, bannissement).
 * @returns Le compte mis à jour, ou null s'il n'existe pas.
 */
export async function updateUserAsAdmin(
  id: string,
  patch: UserAdminPatch,
): Promise<AdminUser | null> {
  const [updated] = await authDb
    .update(user)
    .set({
      ...patch,
      // Lever un bannissement doit effacer son motif : le conserver
      // laisserait croire à une sanction toujours active.
      ...(patch.banned === false ? { banReason: null, banExpires: null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, id))
    .returning();

  if (!updated) return null;

  // Projection publique : seul le rôle y est dénormalisé
  if (patch.role !== undefined) {
    await db
      .update(profiles)
      .set({ role: patch.role, updatedAt: new Date() })
      .where(eq(profiles.userId, id));
  }

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    emailVerified: updated.emailVerified,
    role: updated.role,
    banned: updated.banned,
    banReason: updated.banReason,
    banExpires: updated.banExpires,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Supprime un compte : identité d'abord, projection publique ensuite.
 *
 * Les sessions et `account` liés partent en cascade (contrainte FK de la
 * base identité). Les contributions déjà soumises sont CONSERVÉES : ce
 * sont des décisions de modération dont l'historique a une valeur, et
 * leur champ `submittedBy` ne renvoie plus à aucune identité une fois le
 * compte effacé — la trace devient anonyme, ce qui est l'effet recherché.
 *
 * @param id - Identifiant Better Auth du compte.
 * @returns true si un compte a été supprimé.
 */
export async function deleteUserAsAdmin(id: string): Promise<boolean> {
  const deleted = await authDb
    .delete(user)
    .where(eq(user.id, id))
    .returning({ id: user.id });

  if (deleted.length === 0) return false;

  await db.delete(profiles).where(eq(profiles.userId, id));
  return true;
}
