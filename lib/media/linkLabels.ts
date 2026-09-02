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

/** Domaines reconnus, du plus spécifique au plus générique. */
const KNOWN_HOSTS: [RegExp, string][] = [
  [/(^|\.)bandcamp\.com$/, "Bandcamp"],
  [/(^|\.)spotify\.com$/, "Spotify"],
  [/(^|\.)deezer\.com$/, "Deezer"],
  [/(^|\.)music\.apple\.com$/, "Apple Music"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/(^|\.)youtu\.be$/, "YouTube"],
  [/(^|\.)soundcloud\.com$/, "SoundCloud"],
  [/(^|\.)tidal\.com$/, "Tidal"],
  [/(^|\.)discogs\.com$/, "Discogs"],
  [/(^|\.)allmusic\.com$/, "AllMusic"],
  [/(^|\.)last\.fm$/, "Last.fm"],
  [/(^|\.)rateyourmusic\.com$/, "RateYourMusic"],
  [/(^|\.)metal-archives\.com$/, "Metal Archives"],
  [/(^|\.)wikipedia\.org$/, "Wikipédia"],
  [/(^|\.)wikidata\.org$/, "Wikidata"],
  [/(^|\.)facebook\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)x\.com$/, "X"],
  [/(^|\.)twitter\.com$/, "X"],
  [/(^|\.)bsky\.app$/, "Bluesky"],
  [/(^|\.)threads\.net$/, "Threads"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)vk\.com$/, "VK"],
  [/(^|\.)genius\.com$/, "Genius"],
  [/(^|\.)setlist\.fm$/, "setlist.fm"],
];

/**
 * Nomme un lien d'après son domaine.
 *
 * @param url - URL absolue du lien.
 * @param fallback - Libellé à utiliser si le domaine n'est pas reconnu
 *   (typiquement le type de relation MusicBrainz traduit).
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

  // Domaine inconnu : c'est très probablement le site officiel du
  // groupe ou de son label, et le nom de domaine l'annonce mieux qu'un
  // type de relation générique.
  return fallback === "Site officiel" ? host : `${fallback} · ${host}`;
}
