// Image Open Graph dynamique pour /bands/[slug] (convention Next.js).
// Rendu TYPOGRAPHIQUE uniquement (Satori/ImageResponse) : nom du groupe
// et période d'activité sur fond acier — aucune image générée, conforme
// à la règle stricte du projet (AGENTS.md).

import { ImageResponse } from "next/og";
import { fetchBandBySlug } from "@/hooks/use-bands";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

// Runtime Edge : rendu léger à la demande
export const runtime = "edge";
export const alt = "Groupe metal — Helleilla Exploratium";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Props App Router : params est une promesse en Next 15+. */
type Props = { params: Promise<{ slug: string }> };

export default async function BandOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  // L'image sociale ne montre que le nom : la langue par défaut suffit.
  const band = await fetchBandBySlug(slug, DEFAULT_LOCALE);

  const name = band?.name ?? "Groupe";
  const period = band?.formedYear
    ? `${band.formedYear} – ${band.dissolvedYear ?? "…"}`
    : "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
        color: "#fafafa",
      }}
    >
      {/* Marque du site */}
      <div
        style={{
          fontSize: 28,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "#a1a1aa",
          marginBottom: 24,
        }}
      >
        Helleilla Exploratium
      </div>
      {/* Nom du groupe (acteur principal de la carte) */}
      <div
        style={{
          fontSize: band && name.length > 20 ? 72 : 96,
          fontWeight: 900,
          textTransform: "uppercase",
          lineHeight: 1.1,
        }}
      >
        {name}
      </div>
      {/* Période d'activité */}
      {period && (
        <div style={{ fontSize: 40, marginTop: 16, color: "#d4d4d8" }}>
          {period}
        </div>
      )}
    </div>,
    { ...size },
  );
}
