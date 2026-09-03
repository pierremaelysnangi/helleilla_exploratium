/**
 * Filtre « par genre » partagé par les listes de groupes et d'albums.
 *
 * Un filtre par genre doit être INCLUSIF de ses sous-genres : demander
 * « Black Metal » sans obtenir les groupes rangés en « Symphonic Black
 * Metal » donne une liste incompréhensible, puisque la taxonomie
 * encourage justement le rattachement au sous-genre le plus précis.
 *
 * La hiérarchie est à deux niveaux (`genres.parent_id`), donc un seul
 * niveau de descendance suffit ; c'est vérifié par la forme du schéma,
 * pas seulement par convention.
 */

import { db } from "@/db";
import { albumGenres, bandGenres, genres } from "@/db/schema";
import { eq, inArray, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * Identifiants des groupes rattachés à un genre ou à l'un de ses
 * sous-genres.
 *
 * @param slug - Slug du genre demandé (unique globalement).
 * @returns Les UUID des groupes concernés ; tableau vide si le slug ne
 *   correspond à aucun genre — le filtre doit alors ne rien renvoyer,
 *   et non tout renvoyer.
 */
export async function bandIdsByGenreSlug(slug: string): Promise<string[]> {
  const matching = await db
    .select({ id: genres.id })
    .from(genres)
    .where(
      or(
        eq(genres.slug, slug),
        // Sous-genres : leur parent porte le slug demandé
        inArray(
          genres.parentId,
          db
            .select({ id: genres.id })
            .from(genres)
            .where(eq(genres.slug, slug)),
        ),
      ),
    );

  if (matching.length === 0) return [];

  const rows = await db
    .selectDistinct({ bandId: bandGenres.bandId })
    .from(bandGenres)
    .where(
      inArray(
        bandGenres.genreId,
        matching.map((g) => g.id),
      ),
    );

  return rows.map((r) => r.bandId);
}

/** Identifiants du genre demandé ET de ses sous-genres directs. */
async function matchingGenreIds(slug: string): Promise<string[]> {
  const rows = await db
    .select({ id: genres.id })
    .from(genres)
    .where(
      or(
        eq(genres.slug, slug),
        // Sous-genres : leur parent porte le slug demandé
        inArray(
          genres.parentId,
          db
            .select({ id: genres.id })
            .from(genres)
            .where(eq(genres.slug, slug)),
        ),
      ),
    );
  return rows.map((r) => r.id);
}

/**
 * Clause SQL restreignant une liste aux identifiants fournis.
 *
 * Une liste vide doit produire une clause TOUJOURS fausse : sans cela,
 * `inArray(col, [])` est ignoré par le constructeur de requête et le
 * filtre laisserait passer tout le catalogue.
 */
export function restrictTo(
  /** Colonne UUID à contraindre : `bands.id` ou `albums.bandId`. */
  column: PgColumn,
  ids: readonly string[],
): SQL {
  return ids.length === 0 ? sql`false` : inArray(column, [...ids]);
}

/**
 * Identifiants des SORTIES rattachées à un genre ou à l'un de ses
 * sous-genres, par leur propre qualification.
 *
 * Distinct de `bandIdsByGenreSlug` : une sortie peut appartenir à un
 * autre genre que son groupe. « Soulside Journey » est du death metal
 * quand Darkthrone est un groupe de black metal, et confondre les deux
 * faisait remonter toute la discographie du groupe sous le mauvais
 * filtre.
 *
 * @param slug - Slug du genre demandé.
 * @returns Les UUID des sorties qualifiées ; tableau vide si aucune.
 */
export async function albumIdsByGenreSlug(slug: string): Promise<string[]> {
  const matching = await matchingGenreIds(slug);
  if (matching.length === 0) return [];

  const rows = await db
    .selectDistinct({ albumId: albumGenres.albumId })
    .from(albumGenres)
    .where(inArray(albumGenres.genreId, matching));

  return rows.map((r) => r.albumId);
}

/** Identifiants des SORTIES portant au moins un genre propre. */
export async function albumIdsWithOwnGenres(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ albumId: albumGenres.albumId })
    .from(albumGenres);
  return rows.map((r) => r.albumId);
}
