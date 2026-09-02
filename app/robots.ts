/**
 * robots.txt — règles d'indexation générées par Next.js.
 * - Autorisé : tout le catalogue public (/, /bands, /albums, /genres, détails) ;
 * - Interdit : API interne, pages d'authentification et interfaces
 *   non-contentuelles (recherche) ;
 * - Sitemap déclaré pour la découverte des URLs.
 */

import type { MetadataRoute } from "next";

/** URL de base absolue (cohérente avec metadataBase du layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // endpoints internes (aucun contenu indexable)
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/search", // interface dynamique sans valeur SEO
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
