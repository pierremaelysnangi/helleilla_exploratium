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
export type LyricsSource = "darklyrics" | "azlyrics" | "genius";

/** Libellés affichés dans le panneau d'une piste. */
const LYRICS_LABELS: Record<LyricsSource, string> = {
  darklyrics: "DarkLyrics",
  azlyrics: "AZLyrics",
  genius: "Genius",
};

/**
 * Forme d'un nom dans une URL de DarkLyrics ou d'AZLyrics.
 *
 * Ces deux sites n'ont pas de moteur exploitable : leurs adresses sont
 * construites à partir du nom, réduit à ses lettres et chiffres. Les
 * accents sont décomposés puis retirés — « Mörk Gryning » devient
 * « morkgryning » — et tout le reste (espaces, apostrophes, tirets,
 * ponctuation) disparaît.
 */
export function lyricsSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/gi, "o")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Liens vers les paroles d'une piste.
 *
 * Aucune parole n'est reproduite ici : elles appartiennent à leurs
 * auteurs et à leurs éditeurs. On renvoie vers les sites qui les
 * publient.
 *
 * DarkLyrics et AZLyrics sont adressés DIRECTEMENT, par construction de
 * l'URL : leurs moteurs de recherche renvoyaient le plus souvent une
 * page vide. Ces adresses peuvent ne pas exister — un titre orthographié
 * autrement chez eux, un album absent — d'où Genius en dernier recours,
 * qui dispose, lui, d'une vraie recherche.
 *
 * @param artistName - Nom du groupe interprète.
 * @param trackTitle - Titre de la piste.
 * @param albumTitle - Titre de l'album ; DarkLyrics indexe par album et
 *   non par titre. Sans lui, le lien DarkLyrics est omis.
 */
export function trackLyricsLinks(
  artistName: string,
  trackTitle: string,
  albumTitle?: string,
): Partial<Record<LyricsSource, { label: string; url: string }>> {
  const band = lyricsSlug(artistName);
  const track = lyricsSlug(trackTitle);
  const album = albumTitle ? lyricsSlug(albumTitle) : null;

  return {
    // DarkLyrics range une page par ALBUM ; `#1` amène au premier titre.
    // Le site n'est pas servi en HTTPS, c'est son adresse canonique.
    ...(album && band
      ? {
          darklyrics: {
            label: LYRICS_LABELS.darklyrics,
            url: `http://www.darklyrics.com/lyrics/${band}/${album}.html#1`,
          },
        }
      : {}),

    ...(band && track
      ? {
          azlyrics: {
            label: LYRICS_LABELS.azlyrics,
            url: `https://www.azlyrics.com/lyrics/${band}/${track}.html`,
          },
        }
      : {}),

    genius: {
      label: LYRICS_LABELS.genius,
      url: `https://genius.com/search?q=${searchQuery(artistName, trackTitle)}`,
    },
  };
}
