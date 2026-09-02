/**
 * Liens d'écoute et de paroles officiels pour une piste donnée.
 * Construit des URLs de RECHERCHE profondes vers les plateformes
 * officielles (aucun média généré ni hébergé, aucune parole reproduite :
 * on renvoie l'utilisateur vers la source légitime).
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

/** Sites de paroles proposés pour une piste. */
export type LyricsSource = "metal-archives" | "genius";

/** Libellés affichés dans le panneau d'une piste. */
const LYRICS_LABELS: Record<LyricsSource, string> = {
  "metal-archives": "Metal Archives",
  genius: "Genius",
};

/**
 * Liens vers les paroles d'une piste.
 *
 * Aucune parole n'est reproduite ici : elles sont protégées par le droit
 * d'auteur et appartiennent aux auteurs et à leurs éditeurs. On renvoie
 * vers les bases qui les publient avec l'autorisation nécessaire —
 * Metal Archives pour le metal, Genius en couverture générale.
 *
 * Ce sont des URLs de RECHERCHE : les identifiants internes de ces sites
 * ne sont pas connus du projet, et une recherche reste juste même si la
 * cible change de côté.
 *
 * @param artistName - Nom du groupe interprète.
 * @param trackTitle - Titre de la piste.
 */
export function trackLyricsLinks(
  artistName: string,
  trackTitle: string,
): Record<LyricsSource, { label: string; url: string }> {
  const q = searchQuery(artistName, trackTitle);
  return {
    "metal-archives": {
      label: LYRICS_LABELS["metal-archives"],
      url:
        "https://www.metal-archives.com/search/advanced/searching/songs" +
        `?bandName=${encodeURIComponent(artistName)}` +
        `&songTitle=${encodeURIComponent(trackTitle)}`,
    },
    genius: {
      label: LYRICS_LABELS.genius,
      url: `https://genius.com/search?q=${q}`,
    },
  };
}
