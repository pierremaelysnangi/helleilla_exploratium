/**
 * Libellé lisible d'un lien officiel sortant.
 *
 * MusicBrainz classe ses liens par TYPE de relation, pas par
 * destination : un groupe a souvent trois entrées « streaming » et deux
 * « purchase for download ». Affichées telles quelles, elles donnent une
 * rangée de boutons identiques dont aucun n'annonce où il mène.
 *
 * On nomme donc la destination — Spotify, Bandcamp, YouTube… — et on ne
 * retombe sur le type de relation que pour un domaine inconnu.
 */

/**
 * Domaines reconnus, du plus spécifique au plus générique.
 *
 * La liste est longue à dessein : chaque domaine absent retombait sur le
 * type de relation MusicBrainz, ce qui produisait des libellés comme
 * « Achat / téléchargement · itunes.apple.com » ou « Réseau social ·
 * reverbnation.com ». Le nom de la plateforme suffit ; le reste est du
 * vocabulaire de base de données, pas d'interface.
 */
const KNOWN_HOSTS: [RegExp, string][] = [
  // Écoute et achat
  [/(^|\.)bandcamp\.com$/, "Bandcamp"],
  [/(^|\.)spotify\.com$/, "Spotify"],
  [/(^|\.)deezer\.com$/, "Deezer"],
  [/(^|\.)music\.apple\.com$/, "Apple Music"],
  [/(^|\.)itunes\.apple\.com$/, "iTunes"],
  [/(^|\.)music\.amazon\.[a-z.]+$/, "Amazon Music"],
  [/(^|\.)amazon\.[a-z.]+$/, "Amazon"],
  [/(^|\.)music\.youtube\.com$/, "YouTube Music"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/(^|\.)youtu\.be$/, "YouTube"],
  [/(^|\.)soundcloud\.com$/, "SoundCloud"],
  [/(^|\.)audiomack\.com$/, "Audiomack"],
  [/(^|\.)tidal\.com$/, "Tidal"],
  [/(^|\.)qobuz\.com$/, "Qobuz"],
  [/(^|\.)7digital\.com$/, "7digital"],
  [/(^|\.)beatport\.com$/, "Beatport"],
  [/(^|\.)juno\.co\.uk$/, "Juno"],
  [/(^|\.)play\.google\.com$/, "Google Play"],
  [/(^|\.)mora\.jp$/, "mora"],
  [/(^|\.)ototoy\.jp$/, "OTOTOY"],
  [/(^|\.)napster\.com$/, "Napster"],
  [/(^|\.)pandora\.com$/, "Pandora"],
  [/(^|\.)audius\.co$/, "Audius"],
  [/(^|\.)nicovideo\.jp$/, "niconico"],
  [/(^|\.)vimeo\.com$/, "Vimeo"],

  // Bases de données et documentation
  [/(^|\.)discogs\.com$/, "Discogs"],
  [/(^|\.)allmusic\.com$/, "AllMusic"],
  [/(^|\.)last\.fm$/, "Last.fm"],
  [/(^|\.)rateyourmusic\.com$/, "RateYourMusic"],
  [/(^|\.)metal-archives\.com$/, "Metal Archives"],
  [/(^|\.)wikipedia\.org$/, "Wikipédia"],
  [/(^|\.)wikidata\.org$/, "Wikidata"],
  [/(^|\.)genius\.com$/, "Genius"],
  [/(^|\.)setlist\.fm$/, "setlist.fm"],
  [/(^|\.)imdb\.com$/, "IMDb"],
  [/(^|\.)songkick\.com$/, "Songkick"],
  [/(^|\.)bandsintown\.com$/, "Bandsintown"],
  [/(^|\.)secondhandsongs\.com$/, "SecondHandSongs"],
  [/(^|\.)whosampled\.com$/, "WhoSampled"],
  [/(^|\.)viaf\.org$/, "VIAF"],
  [/(^|\.)isni\.org$/, "ISNI"],

  // Réseaux sociaux
  [/(^|\.)facebook\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)x\.com$/, "X"],
  [/(^|\.)twitter\.com$/, "X"],
  [/(^|\.)bsky\.app$/, "Bluesky"],
  [/(^|\.)threads\.(net|com)$/, "Threads"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)vk\.com$/, "VK"],
  [/(^|\.)mastodon\.[a-z.]+$/, "Mastodon"],
  [/(^|\.)reverbnation\.com$/, "ReverbNation"],
  [/(^|\.)myspace\.com$/, "Myspace"],
  [/(^|\.)patreon\.com$/, "Patreon"],
  [/(^|\.)linktr\.ee$/, "Linktree"],
];

/**
 * Nomme un lien d'après son domaine.
 *
 * @param url - URL absolue du lien.
 * @param fallback - Libellé de secours, utilisé uniquement quand l'URL
 *   elle-même est inexploitable. Un domaine inconnu donne son nom, pas
 *   ce libellé : « uk.7digital.com » se lit, « Achat / téléchargement ·
 *   uk.7digital.com » déborde du bouton.
 */
export function officialLinkLabel(url: string, fallback: string): string {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return fallback;
  }

  for (const [pattern, label] of KNOWN_HOSTS) {
    if (pattern.test(host)) return label;
  }

  // Domaine inconnu : c'est le site du groupe ou celui de son label.
  // Le nom de domaine le désigne mieux que n'importe quelle catégorie —
  // et surtout, il tient sur un bouton, ce que « Achat / téléchargement
  // · uk.7digital.com » ne faisait pas.
  return host;
}
