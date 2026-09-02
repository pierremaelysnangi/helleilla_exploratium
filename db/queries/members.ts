/**
 * @file Requêtes sur les membres et les formations.
 *
 * Ces données étaient jusqu'ici lues à la volée depuis MusicBrainz : elles
 * sont désormais persistées, donc corrigeables localement et joignables.
 * `musicbrainzId` reste le pont vers la source d'origine.
 */

import { db } from "@/db";
import { members, bandMembers, albumLineups, bands, albums } from "@/db/schema";
import { asc, eq, ilike, count } from "drizzle-orm";

/** Ligne « membre » complète. */
export type MemberRow = typeof members.$inferSelect;

/**
 * Membres d'un groupe, actifs d'abord puis anciens, par année d'arrivée.
 *
 * @param bandId - UUID du groupe.
 */
export async function listMembersByBandId(bandId: string) {
  return db
    .select({
      membershipId: bandMembers.id,
      id: members.id,
      name: members.name,
      slug: members.slug,
      musicbrainzId: members.musicbrainzId,
      role: bandMembers.role,
      joinedYear: bandMembers.joinedYear,
      leftYear: bandMembers.leftYear,
    })
    .from(bandMembers)
    .innerJoin(members, eq(bandMembers.memberId, members.id))
    .where(eq(bandMembers.bandId, bandId))
    .orderBy(asc(bandMembers.joinedYear), asc(members.name));
}

/**
 * Détail public d'un membre : sa fiche, ses groupes et les albums sur
 * lesquels il figure.
 *
 * @param slug - Slug du membre.
 * @returns Le détail, ou null si le slug est inconnu.
 */
export async function getMemberBySlug(slug: string) {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.slug, slug))
    .limit(1);
  if (!member) return null;

  const [memberBands, memberAlbums] = await Promise.all([
    db
      .select({
        id: bands.id,
        name: bands.name,
        slug: bands.slug,
        role: bandMembers.role,
        joinedYear: bandMembers.joinedYear,
        leftYear: bandMembers.leftYear,
      })
      .from(bandMembers)
      .innerJoin(bands, eq(bandMembers.bandId, bands.id))
      .where(eq(bandMembers.memberId, member.id))
      .orderBy(asc(bandMembers.joinedYear)),
    db
      .select({
        id: albums.id,
        title: albums.title,
        slug: albums.slug,
        releaseYear: albums.releaseYear,
        bandSlug: bands.slug,
        bandName: bands.name,
        role: albumLineups.role,
      })
      .from(albumLineups)
      .innerJoin(albums, eq(albumLineups.albumId, albums.id))
      .innerJoin(bands, eq(albums.bandId, bands.id))
      .where(eq(albumLineups.memberId, member.id))
      .orderBy(asc(albums.releaseYear)),
  ]);

  return { ...member, bands: memberBands, albums: memberAlbums };
}

/** Liste paginée des membres, filtrable par nom. */
export async function listMembers({
  page,
  perPage,
  q,
}: {
  page: number;
  perPage: number;
  q?: string;
}) {
  const where = q ? ilike(members.name, `%${q}%`) : undefined;
  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(members)
      .where(where)
      .orderBy(asc(members.name))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(members).where(where),
  ]);
  return { items, total: totals?.value ?? 0 };
}

/** Slugs des membres pour le sitemap. */
export async function listMemberSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return db
    .select({ slug: members.slug, updatedAt: members.updatedAt })
    .from(members);
}
