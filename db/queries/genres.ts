/**
 * @file Requêtes (lectures) sur la table `genres`.
 *
 * Regroupe les fonctions de récupération des genres : par identifiant,
 * par slug, liste des genres racines, sous-genres et recherche par nom.
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Table `genres` définie dans le schéma
import { genres, bandGenres } from "@/db/schema";
// Opérateurs SQL : égalité, recherche insensible à la casse, test de nullité
import { asc, eq, ilike, isNull } from "drizzle-orm";

/**
 * Récupère un genre par son identifiant UUID.
 * @param id - Identifiant du genre.
 * @returns Le genre trouvé, ou null s'il n'existe pas.
 */
export async function getGenreById(id: string) {
  const [genre] = await db.select().from(genres).where(eq(genres.id, id));
  return genre ?? null;
}

/**
 * Récupère un genre par son slug (identifiant lisible en URL, unique).
 * @param slug - Slug du genre.
 * @returns Le genre trouvé, ou null s'il n'existe pas.
 */
export async function getGenreBySlug(slug: string) {
  const [genre] = await db.select().from(genres).where(eq(genres.slug, slug));
  return genre ?? null;
}

/**
 * Liste les genres racines (ceux sans parent, `parentId` IS NULL),
 * adapté pour afficher l'arborescence de genres au premier niveau.
 * @param limit - Nombre maximal de genres retournés (100 par défaut).
 * @returns Un tableau de genres racines.
 */
export async function listGenres(limit = 100) {
  return db.select().from(genres).where(isNull(genres.parentId)).limit(limit);
}

/**
 * Liste les sous-genres directs d'un genre parent (un seul niveau).
 * @param parentId - Identifiant UUID du genre parent.
 * @returns Un tableau de sous-genres.
 */
export async function getSubgenres(parentId: string) {
  return db.select().from(genres).where(eq(genres.parentId, parentId));
}

/**
 * Recherche des genres dont le nom contient la requête (insensible
 * à la casse).
 * @param query - Fragment de nom recherché.
 * @returns Jusqu'à 20 genres correspondants.
 */
export async function searchGenresByName(query: string) {
  return db
    .select()
    .from(genres)
    .where(ilike(genres.name, `%${query}%`))
    .limit(20);
}

/**
 * Liste plate des slugs de genres (sitemap SEO).
 */
export async function listGenreSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return db
    .select({ slug: genres.slug, updatedAt: genres.updatedAt })
    .from(genres)
    .limit(5_000);
}

/**
 * Genres rattachés à un groupe.
 *
 * L'écran d'édition a besoin des seuls identifiants pour pré-cocher la
 * sélection ; le nom est joint pour que l'appelant puisse aussi les
 * afficher sans seconde requête.
 */
export async function listGenresByBandId(
  bandId: string,
): Promise<{ id: string; name: string; slug: string }[]> {
  return db
    .select({ id: genres.id, name: genres.name, slug: genres.slug })
    .from(bandGenres)
    .innerJoin(genres, eq(genres.id, bandGenres.genreId))
    .where(eq(bandGenres.bandId, bandId))
    .orderBy(asc(genres.name));
}
