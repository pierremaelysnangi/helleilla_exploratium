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

/** URL de base absolue. */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
  ];

  try {
    // URLs dynamiques ; en cas d'indispo DB, le sitemap reste servable
    // avec les seules routes statiques (dégradé propre).
    //
    // Les URLs /genres/[slug] sont volontairement ABSENTES tant que la page
    // de détail est un placeholder : les déclarer ferait indexer autant de
    // pages « en construction » strictement identiques (thin content).
    // À rétablir en même temps que la page (phase B).
    const bands = await listBandSlugs();

    const bandRoutes: MetadataRoute.Sitemap = bands.map((band) => ({
      url: `${BASE_URL}/bands/${band.slug}`,
      lastModified: band.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...bandRoutes];
  } catch (err) {
    console.error("[sitemap] Base indisponible :", err);
    return staticRoutes;
  }
}
