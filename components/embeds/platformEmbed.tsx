"use client";

/**
 * <PlatformEmbed> — lecteur officiel intégrable (YouTube, Spotify,
 * Bandcamp).
 *
 * Performance & vie privée :
 * - YouTube : FAÇADE par défaut (miniature native, 0 JS de plateforme au
 *   chargement) ; l'iframe nocookie n'est injectée qu'au clic ;
 * - Spotify/Bandcamp : iframe `loading="lazy"` chargée au scroll.
 * Aucun SDK tiers n'est importé — uniquement des iframes officielles.
 */

// Hooks React pour l'état "façade cliquée"
import { useState } from "react";
// Image optimisée Next.js (miniature YouTube via remotePatterns)
import Image from "next/image";
// Résolution URL/référence -> embed officiel
import {
  parseEmbedUrl,
  buildEmbedFromRef,
  type ResolvedEmbed,
} from "@/lib/media/embeds";
import { useT } from "@/lib/i18n/client";

/** Props du composant : une URL publique OU une référence en base. */
type PlatformEmbedProps = {
  /** URL publique quelconque (watch, youtu.be, open.spotify…). */
  url?: string;
  /** Référence brute stockée en external_refs. */
  provider?: string;
  externalId?: string;
  /** Texte alternatif si l'URL/la référence n'est pas résoluble. */
  fallbackLabel?: string;
};

/**
 * Rend le lecteur officiel de la plateforme correspondante.
 * Si aucune résolution n'est possible, affiche un simple lien externe
 * (jamais d'iframe cassée ni de crash).
 */
export function PlatformEmbed({
  url,
  provider,
  externalId,
  fallbackLabel = "Ouvrir sur la plateforme",
}: PlatformEmbedProps) {
  const t = useT();
  // Résolution : URL prioritaire, sinon référence brute
  const resolved: ResolvedEmbed | null = url
    ? parseEmbedUrl(url)
    : provider && externalId
      ? buildEmbedFromRef(provider, externalId)
      : null;

  // YouTube : façade tant que l'utilisateur n'a pas cliqué
  const [facadeClicked, setFacadeClicked] = useState(false);

  if (!resolved) {
    return url ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {fallbackLabel}
      </a>
    ) : null;
  }

  if (resolved.platform === "youtube" && !facadeClicked) {
    return (
      <button
        type="button"
        aria-label={t.app.playVideo}
        onClick={() => setFacadeClicked(true)}
        style={{ cursor: "pointer" }}
      >
        {/* Miniature native YouTube : aucune ressource plateforme JS */}
        <Image
          src={`https://i.ytimg.com/vi/${resolved.nativeId}/hqdefault.jpg`}
          alt={t.app.videoThumbnail}
          loading="lazy"
          width={480}
          height={360}
        />
      </button>
    );
  }

  return (
    <iframe
      src={resolved.embedUrl}
      title={`Lecteur ${resolved.platform}`}
      loading="lazy"
      allow="encrypted-media; picture-in-picture; fullscreen; autoplay"
      referrerPolicy="strict-origin-when-cross-origin"
      width="100%"
      height={resolved.platform === "spotify" ? 152 : 270}
      style={{ border: 0 }}
    />
  );
}
