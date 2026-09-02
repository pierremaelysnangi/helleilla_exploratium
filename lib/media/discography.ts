/**
 * Import de discographie depuis MusicBrainz.
 *
 * Le catalogue partait d'un extrait saisi à la main dans `db/seed/data.ts`
 * — trois à cinq sorties par groupe, là où MusicBrainz en documente
 * plusieurs dizaines. Les fiches paraissaient donc lacunaires sans qu'un
 * quelconque service soit en cause.
 *
 * Ce module comble l'écart, sous deux règles :
 *
 * - **additif seulement** : une sortie déjà présente n'est jamais
 *   réécrite, seule sa référence externe est posée si elle manque. Un
 *   contributeur a pu corriger un titre ou une année, et l'amont n'a pas
 *   autorité sur son travail. L'appariement passe par la MÊME fonction
 *   que la résolution des pochettes (`matchReleaseGroup`) : deux notions
 *   divergentes de « même œuvre » créaient des doublons ;
 * - **périmètre restreint** : albums, EP, démos et live officiels. Les
 *   singles, compilations, rééditions et enregistrements de répétition
 *   noieraient la discographie sans rien apprendre — Celtic Frost compte
 *   34 release-groups pour une douzaine de sorties qui font sens.
 *
 * Aucun média n'est téléchargé : l'import n'écrit que du texte et des
 * identifiants. Pochettes et tracklists suivent, via `albumCovers.ts` et
 * `tracklists.ts`, à partir des références posées ici.
 */

import { db } from "@/db";
import { albums, externalRefs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  listReleaseGroups,
  matchReleaseGroup,
  albumTypeOf,
  normalizeTitle,
  type AlbumType,
  type ReleaseGroup,
} from "@/lib/providers/coverart";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
// Écriture des références : une seule implémentation, partagée avec la
// résolution des pochettes, qui écrit dans la même table.
import { linkAlbumToReleaseGroup } from "./refs";

/**
 * Types de sortie retenus par l'import.
 *
 * Exporté et nommé pour que la règle soit modifiable sans relire la
 * boucle : élargir le périmètre revient à ajouter une valeur ici.
 */
export const MAIN_RELEASE_TYPES: ReadonlySet<AlbumType> = new Set([
  "album",
  "ep",
  "demo",
  "live",
]);

/** Bilan d'un import, du même style que `CoverResolution`. */
export type DiscographyImport = {
  /** Sorties créées en base. */
  imported: number;
  /** Sorties amont déjà présentes localement. */
  matched: number;
  /** Titres écartés, avec la raison. */
  skipped: string[];
};

/**
 * Clé d'identité d'une œuvre : titre normalisé + type.
 *
 * Le titre seul ne suffit pas — un EP et l'album homonyme sont deux
 * œuvres — et l'identifiant amont ne peut pas servir de clé puisqu'on
 * cherche justement à savoir si l'œuvre existe déjà chez nous.
 */
function workKey(title: string, type: AlbumType): string {
  return `${normalizeTitle(title)}|${type}`;
}

/** Date complète `YYYY-MM-DD`, ou `null` si l'amont est imprécis. */
function fullDate(value: string | null | undefined): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/** Année de première parution, ou `null`. */
function releaseYear(group: ReleaseGroup): number | null {
  const year = Number(group["first-release-date"]?.slice(0, 4));
  return Number.isFinite(year) && year > 1000 ? year : null;
}

/**
 * Importe les sorties manquantes d'un groupe.
 *
 * @param bandId - UUID du groupe.
 * @param artistMbid - Son identifiant MusicBrainz.
 * @returns Le bilan de l'import.
 */
export async function importDiscographyForBand(
  bandId: string,
  artistMbid: string,
): Promise<DiscographyImport> {
  const [groups, existing] = await Promise.all([
    listReleaseGroups(artistMbid),
    db
      .select({
        id: albums.id,
        title: albums.title,
        slug: albums.slug,
        type: albums.type,
      })
      .from(albums)
      .where(eq(albums.bandId, bandId)),
  ]);

  const result: DiscographyImport = { imported: 0, matched: 0, skipped: [] };

  // Première passe : quelle œuvre amont correspond à chaque sortie déjà
  // en base ? On réutilise `matchReleaseGroup`, celle-là même qui sert à
  // résoudre les pochettes. Employer une règle d'appariement différente
  // ici produisait des doublons : la résolution des pochettes rattachait
  // l'EP « Morbid Tales » au release-group que MusicBrainz type `Album`,
  // pendant que l'import, exigeant un type identique, créait une seconde
  // fiche pour la même œuvre.
  const consumed = new Set<string>();
  for (const album of existing) {
    const group = matchReleaseGroup(groups, album);
    if (!group) continue;

    consumed.add(group.id);
    result.matched += 1;
    if (!(await linkAlbumToReleaseGroup(album.id, group.id))) {
      result.skipped.push(`${album.title} (référence déjà attribuée)`);
    }
  }

  // Couples (titre, type) déjà représentés, y compris par les créations
  // de cette passe : MusicBrainz publie parfois deux release-groups
  // indiscernables pour une même œuvre (la démo « Thulcandra » de
  // Darkthrone en compte deux), et l'appariement ci-dessus refuse de
  // trancher entre eux — à raison. Il ne faut pas pour autant en créer
  // deux fiches.
  const takenKeys = new Set(existing.map((a) => workKey(a.title, a.type)));
  // Mutable : chaque slug attribué doit être vu par les suivants.
  const takenSlugs = new Set(existing.map((a) => a.slug));

  for (const group of groups) {
    if (consumed.has(group.id)) continue;

    const type = albumTypeOf(group);
    if (!type || !MAIN_RELEASE_TYPES.has(type)) continue;

    const key = workKey(group.title, type);
    if (takenKeys.has(key)) continue;

    const base = slugify(group.title);
    if (!base) {
      // Titre sans caractère latin exploitable : sans slug, pas d'URL.
      result.skipped.push(`${group.title} (slug impossible)`);
      continue;
    }
    const slug = uniqueSlug(base, takenSlugs, type);
    takenSlugs.add(slug);
    takenKeys.add(key);

    const [created] = await db
      .insert(albums)
      .values({
        bandId,
        title: group.title,
        slug,
        type,
        releaseYear: releaseYear(group),
        releaseDate: fullDate(group["first-release-date"]),
      })
      .returning({ id: albums.id });

    await linkAlbumToReleaseGroup(created.id, group.id);
    result.imported += 1;
  }

  return result;
}

/** Indique si un album porte déjà une référence MusicBrainz. */
export async function hasMusicbrainzRef(albumId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: externalRefs.id })
    .from(externalRefs)
    .where(
      and(
        eq(externalRefs.entityType, "album"),
        eq(externalRefs.entityId, albumId),
        eq(externalRefs.provider, "musicbrainz"),
      ),
    )
    .limit(1);
  return Boolean(row);
}
