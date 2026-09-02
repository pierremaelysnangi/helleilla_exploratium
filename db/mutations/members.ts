/**
 * @file Mutations sur les membres et les appartenances.
 *
 * `setBandMembers` remplace l'intégralité de la formation d'un groupe,
 * suivant la même sémantique idempotente que `setBandGenres` et
 * `setExternalRefs` : l'appelant décrit l'état voulu, pas un delta.
 */

import { db } from "@/db";
import { members, bandMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Une ligne de formation soumise par l'appelant. */
export type BandMembershipInput = {
  memberId: string;
  role?: string | null;
  joinedYear?: number | null;
  leftYear?: number | null;
};

/** Crée un membre. */
export async function createMember(data: typeof members.$inferInsert) {
  const [row] = await db.insert(members).values(data).returning();
  return row;
}

/** Met à jour un membre et rafraîchit `updatedAt`. */
export async function updateMember(
  id: string,
  data: Partial<typeof members.$inferInsert>,
) {
  const [row] = await db
    .update(members)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(members.id, id))
    .returning();
  return row;
}

/**
 * Remplace la formation d'un groupe par l'ensemble fourni.
 *
 * Exécuté en transaction : une formation partiellement écrite serait pire
 * qu'une formation inchangée. Une liste vide détache tous les membres.
 *
 * @param bandId - UUID du groupe.
 * @param memberships - État complet voulu.
 */
export async function setBandMembers(
  bandId: string,
  memberships: BandMembershipInput[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(bandMembers).where(eq(bandMembers.bandId, bandId));
    if (memberships.length > 0) {
      await tx.insert(bandMembers).values(
        memberships.map((m) => ({
          bandId,
          memberId: m.memberId,
          role: m.role ?? null,
          joinedYear: m.joinedYear ?? null,
          leftYear: m.leftYear ?? null,
        })),
      );
    }
  });
}
