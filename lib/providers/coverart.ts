/**
 * Provider « pochettes » — MusicBrainz (release-groups) + Cover Art Archive.
 *
 * Pourquoi ces deux services plutôt que Discogs : Cover Art Archive est
 * l'archive de pochettes adossée à MusicBrainz, hébergée par l'Internet
 * Archive. Elle est publique, gratuite et sans jeton, là où le provider
 * Discogs se désactive faute de `DISCOGS_TOKEN` — d'où les monogrammes
 * partout à la place des pochettes.
 *
 * Aucune image n'est copiée : on ne conserve que des URL vers l'archive
 * officielle, conformément à la règle du projet.
 *
 * Deux appels distincts par groupe (et non par album) : MusicBrainz limite
 * à 1 requête/seconde, résoudre album par album serait prohibitif.
 */

import { z } from "zod";
import { fetchJson } from "./http";

const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";

/** Un « release-group » MusicBrainz : l'œuvre, toutes éditions confondues. */
const releaseGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  "primary-type": z.string().nullish(),
  /**
   * Qualificatifs cumulables : « Compilation », « Live », « Demo »…
   * Toujours renvoyés par l'API browse, ils étaient simplement ignorés.
   * Sans eux, une compilation et un album studio homonymes sont
   * indiscernables.
   */
  "secondary-types": z.array(z.string()).default([]),
  /**
   * Artistes crédités sur l'œuvre.
   *
   * Seul signal fiable pour reconnaître un SPLIT : MusicBrainz ne pose
   * pas toujours le type secondaire « Split », mais une sortie partagée
   * est toujours créditée à plus d'un artiste. « Cromlech / Spectres
   * Over Gorgoroth » (Darkthrone et Isengard) n'a aucun type secondaire
   * et se retrouvait donc parmi les albums studio de Darkthrone.
   */
  "artist-credit": z
    .array(z.object({ name: z.string().nullish() }))
    .default([]),
  "first-release-date": z.string().nullish(),
});

export type ReleaseGroup = z.infer<typeof releaseGroupSchema>;

const releaseGroupListSchema = z.object({
  "release-groups": z.array(releaseGroupSchema).default([]),
  /** Total côté serveur : borne la pagination. */
  "release-group-count": z.number().int().default(0),
});

/** Réponse Cover Art Archive : la liste des visuels d'une œuvre. */
const coverArtSchema = z.object({
  images: z
    .array(
      z.object({
        front: z.boolean().nullish(),
        approved: z.boolean().nullish(),
      }),
    )
    .default([]),
});

/** Taille de page maximale acceptée par l'API browse de MusicBrainz. */
const PAGE_SIZE = 100;

/**
 * Garde-fou de pagination : au-delà, on cesse de dérouler.
 *
 * Aucun groupe du catalogue n'approche ce volume ; la borne existe pour
 * qu'une réponse aberrante ne fasse pas boucler le script pendant des
 * heures à une requête par seconde.
 */
const MAX_PAGES = 10;

/**
 * Liste les œuvres d'un artiste (albums, EP, singles, live, compilations).
 *
 * Pagine jusqu'à épuisement : l'API plafonne à 100 par requête, et
 * certains groupes dépassent ce seuil (Paradise Lost en compte 101).
 * S'arrêter à la première page perdait silencieusement la fin de la
 * discographie.
 *
 * @param artistMbid - Identifiant MusicBrainz de l'artiste.
 * @returns Tous les release-groups ; tableau vide si l'artiste n'en a pas.
 */
export async function listReleaseGroups(
  artistMbid: string,
): Promise<ReleaseGroup[]> {
  const all: ReleaseGroup[] = [];
  let total = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    // Pas de filtre `type` : passer plusieurs valeurs séparées par `|` à
    // l'API browse ne renvoyait qu'une poignée de résultats (compilations
    // seules). Le tri se fait chez nous, sur le type projeté.
    const url =
      `${MB_BASE}/release-group?artist=${encodeURIComponent(artistMbid)}` +
      `&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}` +
      `&inc=artist-credits&fmt=json`;
    const result = await fetchJson(url, releaseGroupListSchema, {
      minIntervalMs: 1100,
    });

    const batch = result["release-groups"];
    all.push(...batch);
    total = result["release-group-count"];

    // Page incomplète ou total atteint : plus rien à demander
    if (batch.length < PAGE_SIZE || all.length >= total) break;
  }

  return all;
}

/**
 * URL STABLE de la pochette d'une œuvre.
 *
 * Volontairement l'adresse `coverartarchive.org` et non celle vers
 * laquelle elle redirige : la cible est un nœud Internet Archive au nom
 * variable (`dn710009.ca.archive.org`…), qui serait périmé une fois écrit
 * en base.
 *
 * @param releaseGroupMbid - Identifiant du release-group.
 * @param size - Côté de la vignette en pixels.
 */
export function coverArtUrl(
  releaseGroupMbid: string,
  size: 250 | 500 | 1200 = 500,
): string {
  return `${CAA_BASE}/release-group/${encodeURIComponent(releaseGroupMbid)}/front-${size}`;
}

/**
 * Indique si une œuvre dispose d'une pochette de face.
 *
 * Interroge le manifeste JSON plutôt que de tester l'image : un 404 sur le
 * manifeste est un cas NOMINAL (la plupart des démos et des sorties
 * confidentielles n'ont pas de visuel archivé), pas une panne.
 */
export async function hasCoverArt(releaseGroupMbid: string): Promise<boolean> {
  try {
    const manifest = await fetchJson(
      `${CAA_BASE}/release-group/${encodeURIComponent(releaseGroupMbid)}`,
      coverArtSchema,
      { minIntervalMs: 250, retries: 1 },
    );
    return manifest.images.some((image) => image.front === true);
  } catch {
    // Absence de pochette, ou archive momentanément indisponible :
    // dans les deux cas on n'écrit rien plutôt qu'une URL morte.
    return false;
  }
}

/**
 * Normalise un titre pour l'appariement : casse, accents et ponctuation
 * varient entre notre saisie et MusicBrainz (« & » vs « and », tirets
 * typographiques…), sans que ce soit une œuvre différente.
 */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9&]+/g, "");
}

/** Valeurs de l'enum PostgreSQL `album_type`. */
export type AlbumType =
  "album" | "ep" | "single" | "compilation" | "live" | "demo" | "split";

/**
 * Projection des types secondaires MusicBrainz, par ordre de priorité.
 *
 * Un qualificatif secondaire l'emporte toujours sur le type primaire :
 * MusicBrainz classe une compilation en `primary-type: Album` avec
 * `secondary-types: ["Compilation"]`. Retenir le primaire rangerait
 * « Are You Morbid? » parmi les albums studio.
 */
const SECONDARY_TYPE_MAP: [string, AlbumType][] = [
  // Le split passe AVANT les autres : une sortie partagée reste un
  // split même si elle est aussi live ou démo, et l'attribuer à un seul
  // groupe fausserait sa discographie.
  ["Split", "split"],
  ["Demo", "demo"],
  ["Live", "live"],
  ["Compilation", "compilation"],
];

/** Projection des types primaires MusicBrainz. */
const PRIMARY_TYPE_MAP: Record<string, AlbumType> = {
  Album: "album",
  EP: "ep",
  Single: "single",
  Broadcast: "live",
  Other: "compilation",
};

/**
 * Type local d'un release-group MusicBrainz.
 *
 * @returns Le type projeté, ou `null` si MusicBrainz n'en déclare aucun
 *   d'exploitable — auquel cas on préfère ne rien affirmer.
 */
export function albumTypeOf(group: ReleaseGroup): AlbumType | null {
  for (const [label, type] of SECONDARY_TYPE_MAP) {
    if (group["secondary-types"].includes(label)) return type;
  }

  // Plusieurs artistes crédités et aucun type secondaire : c'est un
  // split. Une compilation multi-artistes, elle, porte le type
  // « Compilation » et a déjà été classée par la boucle ci-dessus.
  if (group["artist-credit"].length > 1) return "split";

  const primary = group["primary-type"];
  return primary ? (PRIMARY_TYPE_MAP[primary] ?? null) : null;
}

/**
 * Retrouve l'œuvre correspondant à un album local.
 *
 * Trois départages successifs sur les homonymes : le titre normalisé,
 * puis l'année, puis le TYPE de sortie. Le dernier n'est pas théorique —
 * MusicBrainz publie deux release-groups « Monotheist » datés 2006, l'un
 * `Album` et l'autre `EP` : sans lui, Celtic Frost restait sans référence
 * canonique pour cet album, donc sans tracklist.
 *
 * En cas d'ambiguïté persistante, renvoie `null` : une pochette erronée
 * est pire qu'une pochette absente.
 */
export function matchReleaseGroup(
  groups: ReleaseGroup[],
  album: { title: string; releaseYear?: number | null; type?: AlbumType },
): ReleaseGroup | null {
  const wanted = normalizeTitle(album.title);
  let candidates = groups.filter((g) => normalizeTitle(g.title) === wanted);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (album.releaseYear) {
    const sameYear = candidates.filter((g) =>
      g["first-release-date"]?.startsWith(String(album.releaseYear)),
    );
    if (sameYear.length === 1) return sameYear[0];
    // Un filtre qui ne laisse rien n'est pas un filtre : on garde
    // l'ensemble précédent pour laisser sa chance au type.
    if (sameYear.length > 1) candidates = sameYear;
  }

  if (album.type) {
    const sameType = candidates.filter((g) => albumTypeOf(g) === album.type);
    if (sameType.length === 1) return sameType[0];
  }

  return null;
}
