/**
 * GET /api/genres/by-slug/:slug — lecture publique d'un genre par son slug,
 * complément de GET /api/genres/:id qui exige un UUID.
 *
 * Le slug de genre est unique globalement (contrainte `unique()` sur la
 * colonne), un seul segment suffit donc — contrairement aux albums.
 */

// Wrapper standard : validation + rate limit (lecture publique)
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
// Validation du paramètre { slug }
import { slugParamSchema } from "@/lib/api/schemas";
// Accès données
import { db } from "@/db";
import { genres } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/genres/by-slug/:slug — genre, parent, sous-genres et groupes.
 *
 * @returns 200 `{ ...genre, parent, subgenres, bands }` ou 404. Limité à
 *   60 requêtes/minute.
 */
export const GET = route(
  {
    params: slugParamSchema,
    rateLimit: { limit: 60, window: 60 },
  },
  async ({ params }) => {
    const row = await db.query.genres.findFirst({
      where: eq(genres.slug, params.slug),
      with: { bandGenres: { with: { band: true } } },
    });
    if (!row) return fail("NOT_FOUND", "Genre introuvable");

    // Contexte hiérarchique : parent direct et sous-genres d'un niveau
    const [parent, subgenres] = await Promise.all([
      row.parentId
        ? db.query.genres.findFirst({ where: eq(genres.id, row.parentId) })
        : Promise.resolve(undefined),
      db.select().from(genres).where(eq(genres.parentId, row.id)),
    ]);

    const { bandGenres: junction, ...genre } = row;

    return ok({
      ...genre,
      parent: parent
        ? { id: parent.id, name: parent.name, slug: parent.slug }
        : null,
      subgenres: subgenres.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
      })),
      // Groupes rattachés, triés par nom pour un rendu stable
      bands: junction
        .map((jg) => jg.band)
        .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    });
  },
);
