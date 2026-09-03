/**
 * GET /api/bands/by-slug/:slug — lecture publique d'un groupe par son
 * slug URL (complément de GET /api/bands/:id qui exige un UUID).
 * Utilisé par les pages publiques et les intégrations externes.
 */

// Wrapper standard : validation + rate limit (lecture publique)
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
// Validation du paramètre { slug } (chaîne non vide bornée)
import { slugParamSchema } from "@/lib/api/schemas";
// Lecture relationnelle band + genres (même projection que /:id)
import { db } from "@/db";
import { bands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localeQuerySchema, localizeBand } from "@/lib/api/localize";

/**
 * GET /api/bands/by-slug/:slug — groupe + genres par slug.
 *
 * @returns 200 `{ ...band, genres }` ou 404 si aucun groupe ne porte
 *   ce slug. Limité à 60 requêtes/minute.
 */
export const GET = route(
  {
    params: slugParamSchema,
    // La langue voyage dans la query : deux langues font deux URL,
    // donc deux entrées de cache distinctes.
    query: localeQuerySchema,
    rateLimit: { limit: 60, window: 60 },
  },
  async ({ params, query }) => {
    const row = await db.query.bands.findFirst({
      where: eq(bands.slug, params.slug),
      with: { bandGenres: { with: { genre: true } } },
    });
    if (!row) return fail("NOT_FOUND", "Groupe introuvable");

    // Même projection publique que GET /api/bands/:id
    const { bandGenres: _junction, ...band } = row;
    const genres = row.bandGenres.map((jg) => ({
      id: jg.genre.id,
      name: jg.genre.name,
      slug: jg.genre.slug,
    }));
    return ok({ ...localizeBand(band, query.locale), genres });
  },
);
