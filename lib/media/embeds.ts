/**
 * Registre des embeds de plateformes musicales.
 * Convertit une URL publique (ou une référence stockée en
 * `external_refs`) en URL d'iframe officielle :
 * - YouTube  : iframe youtube-nocookie + façade miniature (0 JS initial)
 * - Spotify  : widget open.spotify.com/embed
 * - Bandcamp : EmbeddedPlayer (exige l'ID numérique de l'album)
 *
 * Logique pure (testée unitairement) ; le rendu React vit dans
 * `components/embeds/platformEmbed.tsx`.
 */

/** Plateformes disposant d'un lecteur intégrable officiel. */
export type EmbedPlatform = "youtube" | "spotify" | "bandcamp";

/** Résultat de résolution : URL d'iframe prête + métadonnées d'affichage. */
export type ResolvedEmbed = {
  platform: EmbedPlatform;
  /** URL à injecter dans l'iframe (nocookie/lazy gérés par le composant). */
  embedUrl: string;
  /** Identifiant natif extrait (thumbnail YouTube pour la façade). */
  nativeId?: string;
};

/**
 * Tente de convertir une URL publique en embed officiel.
 * Gère les formats usuels : watch/youtu.be/shorts (YouTube),
 * open.spotify.com/{type}/{id}, bandcamp.com/EmbeddedPlayer (déjà embed).
 *
 * @returns La résolution, ou null si la plateforme n'est pas supportée
 *   ou l'URL non reconnue.
 */
export function parseEmbedUrl(rawUrl: string): ResolvedEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  // --- YouTube ---
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be"
  ) {
    const nativeId =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : host.includes("youtube")
          ? (url.searchParams.get("v") ??
            url.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1])
          : null;
    if (!nativeId) return null;
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${nativeId}`,
      nativeId,
    };
  }

  // --- Spotify ---
  if (host === "open.spotify.com") {
    // /intl-xx/<type>/<id> possible selon la locale
    const match = url.pathname.match(
      /\/(?:intl-[a-z-]+\/)?(track|album|artist|playlist)\/([A-Za-z0-9]+)/,
    );
    if (!match) return null;
    return {
      platform: "spotify",
      embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
      nativeId: match[2],
    };
  }

  // --- Bandcamp (déjà au format lecteur intégré) ---
  if (
    host.endsWith("bandcamp.com") &&
    url.pathname.startsWith("/EmbeddedPlayer")
  ) {
    return { platform: "bandcamp", embedUrl: rawUrl };
  }

  return null;
}

/**
 * Construit un embed depuis une référence brute stockée en base
 * (`external_refs`) — nécessaire pour Bandcamp, dont le widget exige
 * l'ID numérique plutôt qu'une URL publique.
 *
 * @returns La résolution, ou null si la plateforme exige un format
 *   d'identifiant non fourni.
 */
export function buildEmbedFromRef(
  provider: string,
  externalId: string,
): ResolvedEmbed | null {
  switch (provider) {
    case "youtube":
      return {
        platform: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${externalId}`,
        nativeId: externalId,
      };
    case "spotify":
      return {
        platform: "spotify",
        embedUrl: `https://open.spotify.com/embed/artist/${externalId}`,
        nativeId: externalId,
      };
    case "bandcamp":
      // ID numérique obligatoire (album=...)
      if (!/^\d+$/.test(externalId)) return null;
      return {
        platform: "bandcamp",
        embedUrl: `https://bandcamp.com/EmbeddedPlayer/album=${externalId}/size=large/artwork=small/`,
        nativeId: externalId,
      };
    default:
      return null;
  }
}
