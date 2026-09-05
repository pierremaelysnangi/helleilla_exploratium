/**
 * @file Lectures du forum — avis publiés sur un groupe ou un album.
 *
 * Chaque avis est renvoyé avec DEUX choses que la table ne porte pas :
 *
 * - le nom affiché de son auteur, lu par jointure sur `profiles`. La
 *   base identité n'est jamais interrogée ici, conformément au
 *   cloisonnement RGPD ; un compte supprimé laisse un avis anonyme
 *   plutôt qu'un identifiant nu ;
 * - le SUJET résolu (nom, slug, et le slug du groupe pour un album),
 *   sans quoi le fil général n'afficherait que des identifiants. La
 *   jointure se fait en une requête : la lire poste par poste
 *   reproduirait le problème des N+1 requêtes sur la page d'accueil.
 */

import { db } from "@/db";
import { albums, bands, forumPosts, profiles } from "@/db/schema";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";

/** Sujet d'un avis, résolu pour l'affichage. */
export type ForumSubject =
  | { kind: "band"; name: string; slug: string }
  | { kind: "album"; name: string; slug: string; bandSlug: string };

/** Un avis tel qu'exposé par l'API et rendu par l'interface. */
export type ForumPost = {
  id: string;
  body: string;
  createdAt: string;
  /** Identifiant de l'auteur : sert au client à reconnaître ses avis. */
  authorId: string;
  /** Nom affiché, ou `null` si le compte a été supprimé. */
  authorName: string | null;
  subject: ForumSubject;
};

/** Projection commune à toutes les lectures d'avis. */
const POST_COLUMNS = {
  id: forumPosts.id,
  body: forumPosts.body,
  createdAt: forumPosts.createdAt,
  authorId: forumPosts.userId,
  authorName: profiles.displayName,
  bandName: bands.name,
  bandSlug: bands.slug,
  albumTitle: albums.title,
  albumSlug: albums.slug,
  albumBandSlug: sql<string | null>`"album_band"."slug"`,
};

/**
 * Alias du groupe atteint par l'album.
 *
 * Un avis d'album a besoin du slug de SON groupe pour construire l'URL
 * canonique `/bands/:band/albums/:album`. La table `bands` étant déjà
 * jointe pour les avis de groupe, il en faut une seconde instance.
 */
const albumBand = sql`"bands" AS "album_band"`;

type PostRow = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string | null;
  bandName: string | null;
  bandSlug: string | null;
  albumTitle: string | null;
  albumSlug: string | null;
  albumBandSlug: string | null;
};

/** Recompose le sujet à partir des colonnes jointes. */
function toPost(row: PostRow): ForumPost {
  const subject: ForumSubject =
    row.albumSlug && row.albumBandSlug
      ? {
          kind: "album",
          name: row.albumTitle ?? row.albumSlug,
          slug: row.albumSlug,
          bandSlug: row.albumBandSlug,
        }
      : {
          kind: "band",
          name: row.bandName ?? "",
          slug: row.bandSlug ?? "",
        };

  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    authorId: row.authorId,
    authorName: row.authorName,
    subject,
  };
}

/** Filtre facultatif sur le sujet. */
export type ForumFilter = { bandId?: string; albumId?: string };

function subjectWhere(filter: ForumFilter) {
  if (filter.bandId) return eq(forumPosts.bandId, filter.bandId);
  if (filter.albumId) return eq(forumPosts.albumId, filter.albumId);
  return undefined;
}

/**
 * Avis, du plus récent au plus ancien.
 *
 * @param filter - Restreint à un groupe ou à un album ; sans filtre,
 *   c'est le fil général.
 * @param page - Page demandée, à partir de 1.
 * @param perPage - Taille de page.
 */
export async function listForumPosts(
  filter: ForumFilter,
  page: number,
  perPage: number,
): Promise<{ posts: ForumPost[]; total: number }> {
  const where = subjectWhere(filter);

  const [rows, counts] = await Promise.all([
    db
      .select(POST_COLUMNS)
      .from(forumPosts)
      .leftJoin(profiles, eq(profiles.userId, forumPosts.userId))
      .leftJoin(bands, eq(bands.id, forumPosts.bandId))
      .leftJoin(albums, eq(albums.id, forumPosts.albumId))
      .leftJoin(albumBand, sql`"album_band"."id" = ${albums.bandId}`)
      .where(where)
      // `id` en dernier critère : deux avis publiés dans la même
      // milliseconde s'échangeraient sinon d'une page à l'autre, et la
      // pagination ferait apparaître le même deux fois.
      .orderBy(desc(forumPosts.createdAt), desc(forumPosts.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ count: count() }).from(forumPosts).where(where),
  ]);

  return {
    posts: (rows as PostRow[]).map(toPost),
    total: counts[0]?.count ?? 0,
  };
}

/**
 * Derniers avis, pour le fil de l'accueil.
 *
 * Volontairement séparé de `listForumPosts` : l'accueil n'a besoin ni
 * de pagination ni de comptage total, et payer un `count(*)` sur toute
 * la table pour afficher cinq lignes serait inutile.
 */
export async function listRecentForumPosts(limit = 5): Promise<ForumPost[]> {
  const rows = await db
    .select(POST_COLUMNS)
    .from(forumPosts)
    .leftJoin(profiles, eq(profiles.userId, forumPosts.userId))
    .leftJoin(bands, eq(bands.id, forumPosts.bandId))
    .leftJoin(albums, eq(albums.id, forumPosts.albumId))
    .leftJoin(albumBand, sql`"album_band"."id" = ${albums.bandId}`)
    .orderBy(desc(forumPosts.createdAt), desc(forumPosts.id))
    .limit(limit);

  return (rows as PostRow[]).map(toPost);
}

/** Sujets les plus actifs, pour ouvrir la page Forums sur du vivant. */
export type ForumSubjectSummary = {
  subject: ForumSubject;
  posts: number;
  lastPostAt: string;
};

/**
 * Groupes et albums où l'on discute, du plus récemment animé au plus
 * ancien.
 *
 * Deux requêtes plutôt qu'un `UNION` : les deux sujets ne partagent
 * aucune colonne de jointure, et la fusion se fait sur quelques dizaines
 * de lignes déjà agrégées.
 */
export async function listActiveSubjects(
  limit = 20,
): Promise<ForumSubjectSummary[]> {
  const [bandRows, albumRows] = await Promise.all([
    db
      .select({
        name: bands.name,
        slug: bands.slug,
        posts: count(),
        lastPostAt: sql<Date>`max(${forumPosts.createdAt})`,
      })
      .from(forumPosts)
      .innerJoin(bands, eq(bands.id, forumPosts.bandId))
      .where(isNull(forumPosts.albumId))
      .groupBy(bands.name, bands.slug),
    db
      .select({
        name: albums.title,
        slug: albums.slug,
        bandSlug: bands.slug,
        posts: count(),
        lastPostAt: sql<Date>`max(${forumPosts.createdAt})`,
      })
      .from(forumPosts)
      .innerJoin(albums, eq(albums.id, forumPosts.albumId))
      .innerJoin(bands, eq(bands.id, albums.bandId))
      .groupBy(albums.title, albums.slug, bands.slug),
  ]);

  const merged: ForumSubjectSummary[] = [
    ...bandRows.map((r) => ({
      subject: { kind: "band" as const, name: r.name, slug: r.slug },
      posts: r.posts,
      lastPostAt: new Date(r.lastPostAt).toISOString(),
    })),
    ...albumRows.map((r) => ({
      subject: {
        kind: "album" as const,
        name: r.name,
        slug: r.slug,
        bandSlug: r.bandSlug,
      },
      posts: r.posts,
      lastPostAt: new Date(r.lastPostAt).toISOString(),
    })),
  ];

  return merged
    .sort((a, b) => b.lastPostAt.localeCompare(a.lastPostAt))
    .slice(0, limit);
}

/** Auteur d'un avis, pour vérifier qui a le droit de le supprimer. */
export async function getForumPostAuthor(id: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: forumPosts.userId })
    .from(forumPosts)
    .where(eq(forumPosts.id, id))
    .limit(1);
  return row?.userId ?? null;
}

/** Nombre d'avis d'un sujet, pour la fiche du groupe ou de l'album. */
export async function countForumPosts(filter: ForumFilter): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(forumPosts)
    .where(and(subjectWhere(filter)));
  return row?.count ?? 0;
}
