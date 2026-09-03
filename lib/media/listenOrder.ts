/**
 * Ordre de présentation des liens d'écoute.
 *
 * Toutes les plateformes ne se valent pas pour qui veut écouter un
 * groupe, et l'ordre alphabétique ou celui de MusicBrainz ne dit rien.
 * La hiérarchie retenue va du plus direct au moins direct :
 *
 *   1. le site officiel du groupe ou de son label — la source, et celle
 *      qui rémunère le mieux les artistes ;
 *   2. Bandcamp — achat direct, part reversée la plus élevée ;
 *   3. Spotify, puis YouTube, puis Deezer — écoute en flux.
 *
 * Le reste (bases de données, réseaux sociaux) vient après : on y va
 * pour se documenter, pas pour écouter.
 *
 * Une sortie n'est pas forcément disponible partout. Les liens issus de
 * MusicBrainz sont DÉCLARÉS : quelqu'un les a vérifiés, ils existent.
 * Les liens de recherche, eux, ne garantissent rien — ils sont donc
 * relégués derrière, et signalés comme des recherches.
 */

/** Rang d'une destination : plus petit, plus haut dans la liste. */
const RANK: [RegExp, number][] = [
  // 1. Site officiel : tout domaine non reconnu par les règles suivantes
  //    est traité comme tel plus bas, via DEFAULT_OFFICIAL_RANK.
  [/(^|\.)bandcamp\.com$/, 2],
  [/(^|\.)spotify\.com$/, 3],
  [/(^|\.)youtube\.com$/, 4],
  [/(^|\.)youtu\.be$/, 4],
  [/(^|\.)deezer\.com$/, 5],
  [/(^|\.)music\.apple\.com$/, 6],
  // Boutiques : à ranger explicitement, faute de quoi leur domaine
  // inconnu les faisait passer pour le site officiel du groupe.
  [/(^|\.)itunes\.apple\.com$/, 6],
  [/(^|\.)tidal\.com$/, 6],
  [/(^|\.)7digital\.com$/, 7],
  [/(^|\.)amazon\.[a-z.]+$/, 7],
  [/(^|\.)qobuz\.com$/, 7],
  [/(^|\.)beatport\.com$/, 7],
  [/(^|\.)juno\.co\.uk$/, 7],
  [/(^|\.)soundcloud\.com$/, 8],
  [/(^|\.)audiomack\.com$/, 8],
  [/(^|\.)music\.youtube\.com$/, 4],
  [/(^|\.)napster\.com$/, 8],
  [/(^|\.)pandora\.com$/, 8],
  [/(^|\.)music\.amazon\.[a-z.]+$/, 6],
  // Documentation : utile, mais on n'y écoute pas
  [/(^|\.)discogs\.com$/, 20],
  [/(^|\.)allmusic\.com$/, 21],
  [/(^|\.)last\.fm$/, 22],
  [/(^|\.)wikipedia\.org$/, 23],
  [/(^|\.)wikidata\.org$/, 24],
  [/(^|\.)rateyourmusic\.com$/, 25],
  [/(^|\.)genius\.com$/, 26],
  // Réseaux sociaux : en dernier
  [/(^|\.)facebook\.com$/, 40],
  [/(^|\.)instagram\.com$/, 41],
  [/(^|\.)x\.com$/, 42],
  [/(^|\.)twitter\.com$/, 42],
  [/(^|\.)threads\.net$/, 43],
  [/(^|\.)tiktok\.com$/, 44],
  [/(^|\.)bsky\.app$/, 45],
  [/(^|\.)vk\.com$/, 46],
];

/**
 * Rang d'un domaine inconnu.
 *
 * Un domaine que nous ne reconnaissons pas est presque toujours le site
 * du groupe ou de son label : c'est la destination la plus directe, donc
 * la première.
 */
const DEFAULT_OFFICIAL_RANK = 1;

/** Rang d'un lien d'après sa destination. */
export function listenRank(url: string): number {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // URL inexploitable : reléguée, jamais mise en avant
    return 99;
  }

  for (const [pattern, rank] of RANK) {
    if (pattern.test(host)) return rank;
  }
  return DEFAULT_OFFICIAL_RANK;
}

/** Trie des liens selon la hiérarchie d'écoute, ordre d'origine préservé à rang égal. */
export function byListenOrder<T extends { url: string }>(links: T[]): T[] {
  return [...links]
    .map((link, index) => ({ link, index, rank: listenRank(link.url) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.link);
}
