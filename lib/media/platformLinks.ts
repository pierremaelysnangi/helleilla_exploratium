/**
 * Liens d'écoute officiels pour une piste donnée.
 * Construit des URLs de RECHERCHE profondes vers les plateformes
 * officielles (aucun média généré ni hébergé : on renvoie l'utilisateur
 * vers la source légitime).
 */

/** Plateformes proposées dans le menu déroulant d'une piste. */
export type TrackLinkPlatform = "deezer" | "spotify" | "bandcamp" | "youtube";

/** Libellés français affichés dans le dropdown. */
const LABELS: Record<TrackLinkPlatform, string> = {
  deezer: "Deezer",
  spotify: "Spotify",
  bandcamp: "Bandcamp",
  youtube: "YouTube",
};

/**
 * Construit la requête de recherche normalisée "artiste titre".
 * Encodée pour URL ; caractères parasites supprimés.
 */
function searchQuery(artistName: string, trackTitle: string): string {
  return encodeURIComponent(
    `${artistName} ${trackTitle}`.replace(/[[\](){}]/g, "").trim(),
  );
}

/**
 * Retourne les liens d'écoute officiels d'une piste, plateforme par
 * plateforme.
 *
 * @param artistName - Nom du groupe/artiste interprète.
 * @param trackTitle - Titre de la piste.
 */
export function trackSearchLinks(
  artistName: string,
  trackTitle: string,
): Record<TrackLinkPlatform, { label: string; url: string }> {
  const q = searchQuery(artistName, trackTitle);
  return {
    deezer: {
      label: LABELS.deezer,
      url: `https://www.deezer.com/search/${q}/track`,
    },
    spotify: {
      label: LABELS.spotify,
      url: `https://open.spotify.com/search/${q}`,
    },
    bandcamp: {
      label: LABELS.bandcamp,
      url: `https://bandcamp.com/search?q=${q}&item_type=t`,
    },
    youtube: {
      label: LABELS.youtube,
      url: `https://www.youtube.com/results?search_query=${q}`,
    },
  };
}
