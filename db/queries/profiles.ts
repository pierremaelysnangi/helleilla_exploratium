/**
 * @file Requêtes sur les profils publics (`profiles`, base contenu).
 *
 * Cette table est la projection minimale des comptes : nom affiché et
 * rôle, sans aucune donnée personnelle. Elle existe pour que le contenu
 * puisse citer un auteur sans jamais interroger la base identité.
 */

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Profil public tel que stocké. */
export type ProfileRow = typeof profiles.$inferSelect;

/**
 * Récupère le profil public d'un compte.
 * @param userId - Identifiant Better Auth.
 * @returns Le profil, ou null s'il n'a pas encore été répliqué.
 */
export async function getProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ?? null;
}
