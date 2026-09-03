/**
 * Provider MusicBrainz — données structurées des groupes.
 * API publique gratuite sans authentification ; User-Agent obligatoire
 * et 1 requête/seconde max (throttling géré par `fetchJson`).
 * Docs : https://musicbrainz.org/doc/MusicBrainz_API
 */

// Récupération JSON validée (cache + retry + throttle)
import { fetchJson } from "./http";
import { z } from "zod";

const BASE = "https://musicbrainz.org/ws/2";

/** Contrat partiel d'un artiste MusicBrainz (champs utiles uniquement). */
const mbArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().nullable().optional(),
  /** Zone principale (plus précise que le code pays ISO). */
  area: z.object({ name: z.string().nullable().optional() }).nullish(),
  /** Période d'activité : begin = formation, end = dissolution. */
  "life-span": z
    .object({
      begin: z.string().nullable().optional(),
      end: z.string().nullable().optional(),
      // `nullish` et non `optional` : MusicBrainz renvoie explicitement
      // `"ended": null` pour un artiste toujours actif. Avec `optional`,
      // la validation échouait — et comme fetchJson ne retente pas une
      // ZodError, TOUTE recherche renvoyant un groupe en activité était
      // perdue, y compris pour le resolver média.
      ended: z.boolean().nullish(),
    })
    .nullish(),
  /** Genres normalisés MusicBrainz. */
  genres: z
    .array(z.object({ name: z.string(), count: z.number().nullish() }))
    .nullish(),
  /**
   * Relations artiste : membres du groupe ("member of band"),
   * identifiants externes ("wikidata" dans la cible de relation).
   */
  relations: z
    .array(
      z.object({
        type: z.string(),
        direction: z.string().nullish(),
        target_type: z.string().nullish(),
        artist: z.object({ id: z.string(), name: z.string() }).nullish(),
        url: z.object({ resource: z.string() }).nullish(),
        /** Période de l'appartenance et statut (membre actuel ou non). */
        begin: z.string().nullish(),
        end: z.string().nullish(),
        ended: z.boolean().nullish(),
        /** Instruments ou fonctions (« guitar », « lead vocals »…). */
        attributes: z.array(z.string()).nullish(),
      }),
    )
    .nullish(),
});

export type MbArtist = z.infer<typeof mbArtistSchema>;

/** Résultat de recherche : liste d'artiste + score. */
export const mbSearchResultSchema = z.object({
  artists: z.array(mbArtistSchema.extend({ score: z.number().nullish() })),
});

/**
 * Recherche d'artistes par nom (autocomplétion / matching contributeur).
 *
 * @param name - Nom saisi (ex : par un contributeur lors d'une soumission).
 * @returns Jusqu'à 5 artistes candidats avec leurs métadonnées.
 */
export async function searchArtists(name: string) {
  const query = encodeURIComponent(name);
  return fetchJson(
    `${BASE}/artist?query=${query}&limit=5&fmt=json`,
    mbSearchResultSchema,
    { minIntervalMs: 1100 },
  );
}

/**
 * Détail complet d'un artiste : période d'activité, pays, genres et
 * relations utiles (membres, lien Wikidata pour l'enrichissement).
 *
 * @param mbid - Identifiant MusicBrainz (UUID) stocké dans external_refs.
 */
export async function getArtist(mbid: string) {
  return fetchJson<MbArtist>(
    // `artist-rels` / `url-rels` : ce sont les noms attendus par l'API.
    // « artist-relations » / « url-relations » renvoyaient un HTTP 400 —
    // donc AUCUNE donnée Wikidata ni membre n'a jamais été résolue, et le
    // resolver média se déclarait dégradé en permanence.
    // Le séparateur `inc` est encodé : un `+` littéral dans une query
    // string est interprété comme une espace par l'API, qui renvoie alors
    // une réponse sans aucune relation — silencieusement.
    `${BASE}/artist/${encodeURIComponent(mbid)}` +
      `?inc=artist-rels%2Burl-rels%2Btags%2Bgenres&fmt=json`,
    mbArtistSchema,
    { minIntervalMs: 1100 },
  );
}

/**
 * Extrait l'ID Wikidata des relations URL de l'artiste (permet ensuite
 * d'appeler `lib/providers/wikidata.ts` pour résumé + image).
 */
export function extractWikidataId(artist: MbArtist): string | null {
  const rel = artist.relations?.find(
    (r) => r.type === "wikidata" && r.url?.resource,
  );
  if (!rel?.url?.resource) return null;
  return rel.url.resource.split("/").pop() ?? null;
}

/**
 * Une piste d'un support : position, titre et durée en millisecondes.
 */
const mbTrackSchema = z.object({
  position: z.number().int(),
  title: z.string(),
  length: z.number().int().nullish(),
});

/** Un support physique ou numérique d'une édition (disque 1, disque 2…). */
const mbMediumSchema = z.object({
  position: z.number().int().nullish(),
  tracks: z.array(mbTrackSchema).default([]),
});

const mbReleaseListSchema = z.object({
  releases: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        date: z.string().nullish(),
        media: z.array(mbMediumSchema).default([]),
      }),
    )
    .default([]),
});

/** Piste normalisée, prête à être insérée en base. */
export type MbTrack = {
  discNumber: number;
  trackNumber: number;
  title: string;
  durationMs: number | null;
};

/**
 * Tracklist d'une œuvre, lue sur sa PREMIÈRE édition parue.
 *
 * Un release-group réunit toutes les éditions d'un même album — originale,
 * rééditions, versions augmentées. Prendre la plus ancienne donne la
 * tracklist de référence, sans les bonus ajoutés après coup.
 *
 * @param releaseGroupMbid - Identifiant du release-group.
 * @returns Les pistes ordonnées, ou un tableau vide si aucune édition
 *   n'est documentée.
 */
export async function listReleaseGroupTracks(
  releaseGroupMbid: string,
): Promise<MbTrack[]> {
  const result = await fetchJson(
    `${BASE}/release?release-group=${encodeURIComponent(releaseGroupMbid)}` +
      `&inc=recordings&limit=25&fmt=json`,
    mbReleaseListSchema,
    { minIntervalMs: 1100 },
  );

  // Choix de l'édition, par ordre d'importance décroissant :
  //
  // 1. celle dont le plus de pistes portent une DURÉE. Les rééditions et
  //    les coffrets sont souvent catalogués sans longueurs, et retenir la
  //    plus ancienne donnait des tracklists entières affichant « — » —
  //    alors qu'une autre édition du même disque les renseigne ;
  // 2. à égalité, la plus ancienne : c'est l'édition de référence, celle
  //    dont l'ordre et le découpage font foi.
  const candidates = result.releases.filter((r) =>
    r.media.some((m) => m.tracks.length > 0),
  );
  if (candidates.length === 0) return [];

  const withDurations = (release: (typeof candidates)[number]) =>
    release.media.reduce(
      (n, m) => n + m.tracks.filter((t) => t.length != null).length,
      0,
    );

  const chosen = [...candidates].sort(
    (a, b) =>
      withDurations(b) - withDurations(a) ||
      (a.date ?? "9999").localeCompare(b.date ?? "9999"),
  )[0];

  return chosen.media.flatMap((medium, index) =>
    medium.tracks.map((track) => ({
      discNumber: medium.position ?? index + 1,
      trackNumber: track.position,
      title: track.title,
      durationMs: track.length ?? null,
    })),
  );
}

/** Appartenance d'une personne à un groupe, avec sa période. */
export type MbMembership = {
  id: string;
  name: string;
  /** `true` si la personne a quitté le groupe. */
  ended: boolean;
  beginYear: number | null;
  endYear: number | null;
  /** Instruments ou fonctions déclarés (« guitar », « lead vocals »…). */
  roles: string[];
};

/** Extrait l'année d'une date MusicBrainz partielle (« 1991-03 »). */
function yearOf(date: string | null | undefined): number | null {
  const year = Number(date?.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

/**
 * Membres du groupe, distinguant les actifs des anciens.
 *
 * Un simple nom ne suffisait pas : impossible d'afficher qui
 * joue encore. La relation porte pourtant `ended`, `begin` et `end`.
 */
export function extractMemberships(artist: MbArtist): MbMembership[] {
  const seen = new Map<string, MbMembership>();

  for (const relation of artist.relations ?? []) {
    // `backward` : la relation part du musicien vers le groupe, seul sens
    // qui décrit le line-up quand l'entité interrogée est le groupe.
    if (
      relation.type !== "member of band" ||
      relation.direction !== "backward" ||
      !relation.artist
    ) {
      continue;
    }

    const beginYear = yearOf(relation.begin);
    const endYear = yearOf(relation.end);
    const membership: MbMembership = {
      id: relation.artist.id,
      name: relation.artist.name,
      ended: relation.ended === true || endYear !== null,
      beginYear,
      endYear,
      roles: relation.attributes ?? [],
    };

    // Une même personne peut avoir plusieurs passages (départ puis
    // retour) : un passage en cours prime, sinon le plus récent.
    const previous = seen.get(membership.id);
    if (previous && !isMoreRelevant(membership, previous)) continue;
    seen.set(membership.id, membership);
  }

  return [...seen.values()].sort((a, b) => {
    if (a.ended !== b.ended) return a.ended ? 1 : -1; // actifs d'abord
    return (a.beginYear ?? 9999) - (b.beginYear ?? 9999);
  });
}

/** Vrai si `candidate` décrit mieux le line-up actuel que `current`. */
function isMoreRelevant(
  candidate: MbMembership,
  current: MbMembership,
): boolean {
  if (candidate.ended !== current.ended) return !candidate.ended;
  return (candidate.beginYear ?? 0) > (current.beginYear ?? 0);
}

/** Lien officiel rattaché à un groupe. */
export type MbOfficialLink = {
  /** Type de relation MusicBrainz brut. */
  kind: string;
  url: string;
};

/**
 * Liens officiels déclarés sur MusicBrainz : site du groupe, réseaux
 * sociaux, plateformes d'écoute, bases de référence.
 *
 * Seule une liste blanche de types est retenue : les relations couvrent
 * aussi des ressources sans intérêt public (identifiants internes, pages
 * de setlists…), et tout exposer ferait du bruit.
 */
const OFFICIAL_LINK_TYPES = new Set([
  "official homepage",
  "social network",
  "streaming",
  "free streaming",
  "purchase for download",
  "bandcamp",
  "discogs",
  "allmusic",
  "last.fm",
  "wikipedia",
  "youtube",
  "soundcloud",
]);

export function extractOfficialLinks(artist: MbArtist): MbOfficialLink[] {
  const seen = new Set<string>();
  const links: MbOfficialLink[] = [];

  for (const relation of artist.relations ?? []) {
    if (!relation.url?.resource) continue;
    if (!OFFICIAL_LINK_TYPES.has(relation.type)) continue;
    if (seen.has(relation.url.resource)) continue;
    seen.add(relation.url.resource);
    links.push({ kind: relation.type, url: relation.url.resource });
  }
  return links;
}
