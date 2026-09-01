/**
 * sitemap.xml — plan de site dynamique pour l'indexation Google.
 * Routes statiques + URLs dynamiques issues de la base (groupes), avec
 * dates de dernière modification. Seules les pages réellement rendues y
 * figurent : une URL déclarée ici est une promesse de contenu.
 * Généré à la demande (route dynamique Next.js) : les nouveaux groupes
 * apparaissent au prochain crawl sans redéploiement.
 */

import type { MetadataRoute } from "next";
// Lectures DB directes (contexte serveur, exécuté par le runtime Next)
import { listBandSlugs } from "@/db/queries/bands";
import { listAlbumSlugs } from "@/db/queries/albums";
import { listGenreSlugs } from "@/db/queries/genres";

/** URL de base absolue. */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Toujours frais : les nouveaux groupes apparaissent dès le prochain
// crawl sans redéploiement (le volume reste modeste à cette échelle).
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Routes statiques du catalogue public (recherche/auth exclues : noindex)
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/bands`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/albums`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/genres`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    // URLs dynamiques ; en cas d'indispo DB, le sitemap reste servable
    // avec les seules routes statiques (dégradé propre).
    //
    // Ne figurent ici que des pages réellement rendues. /bands/[slug]/members
    // reste exclue : son contenu vient de MusicBrainz, n'est pas persisté et
    // la page est déclarée noindex.
    const [bands, albums, genres] = await Promise.all([
      listBandSlugs(),
      listAlbumSlugs(),
      listGenreSlugs(),
    ]);

    const bandRoutes: MetadataRoute.Sitemap = bands.flatMap((band) => [
      {
        url: `${BASE_URL}/bands/${band.slug}`,
        lastModified: band.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/bands/${band.slug}/discography`,
        lastModified: band.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ]);

    // URL canonique band-scopée : le slug d'album seul est ambigu
    const albumRoutes: MetadataRoute.Sitemap = albums.map((album) => ({
      url: `${BASE_URL}/bands/${album.bandSlug}/albums/${album.slug}`,
      lastModified: album.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    const genreRoutes: MetadataRoute.Sitemap = genres.map((genre) => ({
      url: `${BASE_URL}/genres/${genre.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    return [...staticRoutes, ...bandRoutes, ...albumRoutes, ...genreRoutes];
  } catch (err) {
    console.error("[sitemap] Base indisponible :", err);
    return staticRoutes;
  }
}
