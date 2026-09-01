/**
 * @file Requêtes (lectures) sur la table `albums`.
 *
 * Regroupe les fonctions de récupération d'albums : par identifiant, par slug,
 * listes paginées/triées, recherche plein texte (trigram) et chargement
 * relationnel (album + groupe + pistes).
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Tables `albums` et `bands` (jointure pour la résolution par slug)
import { albums, bands } from "@/db/schema";
// Opérateurs SQL : égalité, recherche insensible à la casse, tri décroissant
import { eq, ilike, desc } from "drizzle-orm";

/**
 * Récupère un album par son identifiant UUID.
 * @param id - Identifiant de l'album.
 * @returns L'album trouvé, ou null s'il n'existe pas.
 */
export async function getAlbumById(id: string) {
  const [album] = await db.select().from(albums).where(eq(albums.id, id));
  return album ?? null;
}

/**
 * Récupère un album par son slug.
 *
 * ⚠️ Le slug n'est unique QUE dans un groupe (contrainte
 * `albums_band_slug_uq` sur `(band_id, slug)`) : si deux groupes ont une
 * sortie homonyme (« live », « demo »…), le résultat est arbitraire.
 * Pour une résolution déterministe, préférer `listAlbumsBySlugWithBand`
 * ou une lecture bornée par `bandId`.
 *
 * @param slug - Slug de l'album.
 * @returns Un album portant ce slug, ou null s'il n'en existe aucun.
 */
export async function getAlbumBySlug(slug: string) {
  const [album] = await db.select().from(albums).where(eq(albums.slug, slug));
  return album ?? null;
}

/**
 * Liste plate des albums avec le slug de leur groupe (sitemap SEO).
 *
 * Les deux slugs sont nécessaires : l'URL canonique d'un album est
 * band-scopée, son slug seul ne suffisant pas à l'identifier.
 *
 * @returns Couples { bandSlug, slug } et date de dernière modification.
 */
export async function listAlbumSlugs(): Promise<
  { bandSlug: string; slug: string; updatedAt: Date }[]
> {
  return db
    .select({
      bandSlug: bands.slug,
      slug: albums.slug,
      updatedAt: albums.updatedAt,
    })
    .from(albums)
    .innerJoin(bands, eq(albums.bandId, bands.id));
}

/**
 * Liste TOUS les albums portant un slug donné, avec le groupe propriétaire.
 *
 * Sert à résoudre l'URL héritée `/albums/[slug]` : zéro résultat -> 404,
 * un seul -> redirection vers l'URL canonique band-scopée, plusieurs ->
 * page de levée d'ambiguïté.
 *
 * @param slug - Slug d'album recherché.
 * @returns Les couples { album, band } correspondants, triés par groupe.
 */
export async function listAlbumsBySlugWithBand(slug: string) {
  return db
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      type: albums.type,
      releaseYear: albums.releaseYear,
      coverUrl: albums.coverUrl,
      bandName: bands.name,
      bandSlug: bands.slug,
    })
    .from(albums)
    .innerJoin(bands, eq(albums.bandId, bands.id))
    .where(eq(albums.slug, slug))
    .orderBy(bands.name);
}

/**
 * Liste les albums triés par date de sortie décroissante.
 * @param limit - Nombre maximal d'albums retournés (20 par défaut).
 * @returns Un tableau d'albums.
 */
export async function listAlbums(limit = 20) {
  return db
    .select()
    .from(albums)
    .orderBy(desc(albums.releaseDate))
    .limit(limit);
}

/**
 * Liste tous les albums d'un groupe donné, du plus récent au plus ancien.
 * @param bandId - Identifiant UUID du groupe.
 * @returns Un tableau d'albums appartenant au groupe.
 */
export async function listAlbumsByBandId(bandId: string) {
  return db
    .select()
    .from(albums)
    .where(eq(albums.bandId, bandId))
    .orderBy(desc(albums.releaseDate));
}

/**
 * Recherche des albums dont le titre contient la requête (insensible
 * à la casse, exploite l'index trigram GIN sur `title`).
 * @param query - Fragment de titre recherché.
 * @returns Jusqu'à 20 albums correspondants.
 */
export async function searchAlbumsByTitle(query: string) {
  return db
    .select()
    .from(albums)
    .where(ilike(albums.title, `%${query}%`))
    .limit(20);
}

/**
 * Récupère un album avec son groupe et ses pistes via l'API relationnelle
 * de Drizzle (`db.query`, basée sur les relations définies dans relations.ts).
 * @param id - Identifiant UUID de l'album.
 * @returns L'album enrichi (`band`, `tracks`) ou undefined s'il n'existe pas.
 */
export async function getAlbumWithTracks(id: string) {
  return db.query.albums.findFirst({
    where: (albums, { eq }) => eq(albums.id, id),
    with: {
      band: true,
      tracks: true,
    },
  });
}

/**
 * Liste uniquement les identifiants des albums d'un groupe
 * (utile pour des requêtes `IN` ou des suppressions en masse).
 * @param bandId - Identifiant UUID du groupe.
 * @returns Un tableau d'identifiants d'albums.
 */
export async function listAlbumIdsByBandId(bandId: string) {
  const rows = await db
    .select({ id: albums.id })
    .from(albums)
    .where(eq(albums.bandId, bandId));
  return rows.map((r) => r.id);
}
