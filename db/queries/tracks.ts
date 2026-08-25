/**
 * @file Requêtes (lectures) sur la table `tracks`.
 *
 * Regroupe les fonctions de récupération de pistes : par identifiant,
 * par album, recherche plein texte, chargement relationnel (piste + album
 * + groupe) et récupérations d'identifiants en masse.
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Table `tracks` définie dans le schéma
import { tracks } from "@/db/schema";
// Opérateurs SQL : égalité, recherche insensible à la casse, appartenance à une liste
import { eq, ilike, inArray } from "drizzle-orm";

/**
 * Récupère une piste par son identifiant UUID.
 * @param id - Identifiant de la piste.
 * @returns La piste trouvée, ou null si elle n'existe pas.
 */
export async function getTrackById(id: string) {
  const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
  return track ?? null;
}

/**
 * Liste les pistes d'un album ordonnées par numéro de piste.
 * @param albumId - Identifiant UUID de l'album.
 * @returns Un tableau de pistes triées.
 */
export async function listTracksByAlbumId(albumId: string) {
  return db
    .select()
    .from(tracks)
    .where(eq(tracks.albumId, albumId))
    .orderBy(tracks.trackNumber);
}

/**
 * Recherche des pistes dont le titre contient la requête (insensible
 * à la casse, exploite l'index trigram GIN sur `title`).
 * @param query - Fragment de titre recherché.
 * @returns Jusqu'à 20 pistes correspondantes.
 */
export async function searchTracksByTitle(query: string) {
  return db
    .select()
    .from(tracks)
    .where(ilike(tracks.title, `%${query}%`))
    .limit(20);
}

/**
 * Récupère une piste avec son album et le groupe associé via l'API
 * relationnelle de Drizzle (`db.query`, basée sur relations.ts).
 * Utile pour afficher le contexte complet d'une piste (ex. lecteur audio).
 * @param id - Identifiant UUID de la piste.
 * @returns La piste enrichie (`album.band`) ou undefined si elle n'existe pas.
 */
export async function getTrackWithAlbum(id: string) {
  return db.query.tracks.findFirst({
    where: (tracks, { eq }) => eq(tracks.id, id),
    with: {
      album: {
        with: { band: true },
      },
    },
  });
}

/**
 * Liste uniquement les identifiants des pistes d'un album.
 * @param albumId - Identifiant UUID de l'album.
 * @returns Un tableau d'identifiants de pistes.
 */
export async function listTrackIdsByAlbumId(albumId: string) {
  const rows = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(eq(tracks.albumId, albumId));
  return rows.map((r) => r.id);
}

/**
 * Liste les identifiants des pistes appartenant à plusieurs albums
 * (requête `IN`). Retourne un tableau vide si la liste d'albums est vide,
 * évitant ainsi une requête inutile ou invalide.
 * @param albumIds - Identifiants UUID des albums.
 * @returns Un tableau d'identifiants de pistes.
 */
export async function listTrackIdsByAlbumIds(albumIds: string[]) {
  if (albumIds.length === 0) return [];
  const rows = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(inArray(tracks.albumId, albumIds));
  return rows.map((r) => r.id);
}
