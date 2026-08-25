/**
 * @file Requêtes (lectures) sur la table `bands`.
 *
 * Regroupe les fonctions de récupération de groupes : par identifiant,
 * par slug, listes récentes, recherche plein texte (trigram) et chargement
 * relationnel complet (groupe + albums + pistes + genres).
 */

// Instance unique de la base de données Drizzle
import { db } from "@/db";
// Table `bands` définie dans le schéma
import { bands } from "@/db/schema";
// Opérateurs SQL : égalité, recherche insensible à la casse, tri décroissant
import { eq, ilike, desc } from "drizzle-orm";

/**
 * Récupère un groupe par son identifiant UUID.
 * @param id - Identifiant du groupe.
 * @returns Le groupe trouvé, ou null s'il n'existe pas.
 */
export async function getBandById(id: string) {
  const [band] = await db.select().from(bands).where(eq(bands.id, id));
  return band ?? null;
}

/**
 * Récupère un groupe par son slug (identifiant lisible en URL, unique).
 * @param slug - Slug du groupe.
 * @returns Le groupe trouvé, ou null s'il n'existe pas.
 */
export async function getBandBySlug(slug: string) {
  const [band] = await db.select().from(bands).where(eq(bands.slug, slug));
  return band ?? null;
}

/**
 * Liste les groupes les plus récemment créés.
 * @param limit - Nombre maximal de groupes retournés (20 par défaut).
 * @returns Un tableau de groupes triés par `createdAt` décroissant.
 */
export async function listBands(limit = 20) {
  return db.select().from(bands).orderBy(desc(bands.createdAt)).limit(limit);
}

/**
 * Recherche des groupes dont le nom contient la requête (insensible
 * à la casse, exploite l'index trigram GIN sur `name`).
 * @param query - Fragment de nom recherché.
 * @returns Jusqu'à 20 groupes correspondants.
 */
export async function searchBandsByName(query: string) {
  return db
    .select()
    .from(bands)
    .where(ilike(bands.name, `%${query}%`))
    .limit(20);
}

/**
 * Récupère un groupe avec sa discographie complète (albums → pistes)
 * et ses genres associés via l'API relationnelle de Drizzle
 * (`db.query`, basée sur les relations définies dans relations.ts).
 * @param id - Identifiant UUID du groupe.
 * @returns Le groupe enrichi (`albums.tracks`, `bandGenres.genre`)
 *   ou undefined s'il n'existe pas.
 */
export async function getBandWithAlbumsAndGenres(id: string) {
  return db.query.bands.findFirst({
    where: (bands, { eq }) => eq(bands.id, id),
    with: {
      albums: {
        with: { tracks: true },
      },
      bandGenres: {
        with: { genre: true },
      },
    },
  });
}
