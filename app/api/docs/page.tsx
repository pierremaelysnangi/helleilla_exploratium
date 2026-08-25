/**
 * Page Next.js servant la documentation interactive de l'API (/api/docs).
 * Simple coquille serveur : métadonnées + rendu du composant client `ApiDocs`.
 */
// `Metadata` : type Next.js pour les métadonnées de la page.
import type { Metadata } from "next";
// Composant client affichant l'interface Swagger UI.
import { ApiDocs } from "./apiDocs";

/**
 * Métadonnées de la page : titre personnalisé et exclusion
 * de l'indexation par les moteurs de recherche (noindex, nofollow).
 */
export const metadata: Metadata = {
  title: "API Docs — Helleilla Exploratium",
  robots: { index: false, follow: false },
};

/**
 * Composant de page par défaut — rend Swagger UI via `ApiDocs`.
 *
 * @returns La page de documentation de l'API.
 */
export default function DocsPage() {
  return <ApiDocs />;
}
