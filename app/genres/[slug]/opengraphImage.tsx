// Génération d'image pour les balises Open Graph (partage réseaux sociaux)
// de la route /genres/[slug], via la convention opengraph-image.
import { ImageResponse } from "next/og";

// Exécution sur le runtime Edge (génération d'image à la demande, légère et rapide)
export const runtime = "edge";
// Texte alternatif de l'image générée
export const alt = "Genre metal";
// Dimensions standard d'une image Open Graph (1200x630 px)
export const size = { width: 1200, height: 630 };
// Format de l'image renvoyée
export const contentType = "image/png";

/**
 * Génère l'image Open Graph affichée lors du partage des pages de genre.
 * Utilise ImageResponse (Satori) pour rendre du JSX en image PNG.
 */
export default async function Image() {
  // Rendu d'un fond noir avec le nom du site centré en blanc
  return new ImageResponse(
    <div
      style={{
        fontSize: 64,
        background: "black",
        color: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Helleilla Exploratium
    </div>,
    { ...size },
  );
}
