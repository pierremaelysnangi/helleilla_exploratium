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
  "first-release-date": z.string().nullish(),
});

export type ReleaseGroup = z.infer<typeof releaseGroupSchema>;

const releaseGroupListSchema = z.object({
  "release-groups": z.array(releaseGroupSchema).default([]),
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

/**
 * Liste les œuvres d'un artiste (albums, EP, singles, live, compilations).
 *
 * @param artistMbid - Identifiant MusicBrainz de l'artiste.
 * @returns Jusqu'à 100 release-groups ; tableau vide si l'artiste n'en a pas.
 */
export async function listReleaseGroups(
  artistMbid: string,
): Promise<ReleaseGroup[]> {
  // Pas de filtre `type` : passer plusieurs valeurs séparées par `|` à
  // l'API browse ne renvoyait qu'une poignée de résultats (compilations
  // seules). L'appariement se fait sur le titre, le type n'apporte rien.
  const url =
    `${MB_BASE}/release-group?artist=${encodeURIComponent(artistMbid)}` +
    `&limit=100&fmt=json`;
  const result = await fetchJson(url, releaseGroupListSchema, {
    minIntervalMs: 1100,
  });
  return result["release-groups"];
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

/**
 * Retrouve l'œuvre correspondant à un album local.
 *
 * L'appariement se fait sur le titre normalisé, puis l'année départage les
 * homonymes — un groupe peut rééditer un album sous le même titre. En cas
 * d'ambiguïté persistante, renvoie `null` : une pochette erronée est pire
 * qu'une pochette absente.
 */
export function matchReleaseGroup(
  groups: ReleaseGroup[],
  album: { title: string; releaseYear?: number | null },
): ReleaseGroup | null {
  const wanted = normalizeTitle(album.title);
  const sameTitle = groups.filter((g) => normalizeTitle(g.title) === wanted);

  if (sameTitle.length === 0) return null;
  if (sameTitle.length === 1) return sameTitle[0];

  if (album.releaseYear) {
    const sameYear = sameTitle.filter((g) =>
      g["first-release-date"]?.startsWith(String(album.releaseYear)),
    );
    if (sameYear.length === 1) return sameYear[0];
  }
  return null;
}
