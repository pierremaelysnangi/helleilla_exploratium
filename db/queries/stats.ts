/**
 * @file Compteurs agrégés de l'espace d'administration.
 *
 * Lecture directe en base plutôt que via l'API : ces chiffres sont
 * consommés par un Server Component, et `apiFetch` ne transporte pas le
 * cookie de session — un appel HTTP à `/api/users` se ferait refuser.
 * C'est la même approche que `app/sitemap.ts`.
 *
 * Les comptes viennent de la base IDENTITÉ, le reste de la base contenu :
 * d'où deux instances Drizzle distinctes dans ce fichier.
 */

import { db } from "@/db";
import { authDb } from "@/lib/auth-db";
import { albums, bands, contributions, genres, tracks } from "@/db/schema";
import { user } from "@/db/schema/auth";
import { count, eq, inArray } from "drizzle-orm";
import { OPEN_STATUSES } from "@/db/queries/contributions";

/** Chiffres affichés sur le tableau de bord d'administration. */
export type AdminStats = {
  bands: number;
  albums: number;
  tracks: number;
  genres: number;
  users: number;
  admins: number;
  /** Dossiers de contribution encore ouverts (à relire). */
  openContributions: number;
};

/** Extrait la valeur d'un `select({ value: count() })`. */
function first(rows: { value: number }[]): number {
  return rows[0]?.value ?? 0;
}

/**
 * Agrège les compteurs du tableau de bord en une seule salve de requêtes.
 *
 * @returns Les totaux par entité ; les compteurs indisponibles ne sont pas
 *   remplacés par des zéros silencieux — une panne remonte à l'appelant.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const [
    bandRows,
    albumRows,
    trackRows,
    genreRows,
    userRows,
    adminRows,
    openRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(bands),
    db.select({ value: count() }).from(albums),
    db.select({ value: count() }).from(tracks),
    db.select({ value: count() }).from(genres),
    authDb.select({ value: count() }).from(user),
    authDb.select({ value: count() }).from(user).where(eq(user.role, "admin")),
    db
      .select({ value: count() })
      .from(contributions)
      .where(inArray(contributions.status, [...OPEN_STATUSES])),
  ]);

  return {
    bands: first(bandRows),
    albums: first(albumRows),
    tracks: first(trackRows),
    genres: first(genreRows),
    users: first(userRows),
    admins: first(adminRows),
    openContributions: first(openRows),
  };
}
