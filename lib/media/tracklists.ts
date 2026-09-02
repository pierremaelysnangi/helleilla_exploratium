/**
 * Récupération des tracklists depuis MusicBrainz.
 *
 * Deux traitements complémentaires, jamais destructifs :
 *
 * 1. un album DÉPOURVU de pistes reçoit la tracklist amont ;
 * 2. un album déjà documenté ne voit compléter que ses DURÉES manquantes,
 *    par appariement sur le TITRE normalisé.
 *
 * Une tracklist saisie localement a pu être corrigée à la main : titres,
 * ordre et découpage restent intouchés. Seule une durée absente est
 * écrite, car aucune saisie manuelle ne peut être perdue en remplissant
 * un champ vide.
 *
 * Dépend de la référence release-group posée par la résolution des
 * pochettes : sans elle, aucune tracklist n'est atteignable.
 */

import { db } from "@/db";
import { albums, externalRefs, tracks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { listReleaseGroupTracks } from "@/lib/providers/musicbrainz";

/** Bilan du remplissage pour un groupe. */
export type TracklistResolution = {
  /** Albums pour lesquels des pistes ont été écrites. */
  filled: number;
  /** Nombre total de pistes insérées. */
  tracks: number;
  /** Durées complétées sur des pistes déjà présentes. */
  durations: number;
  /** Albums laissés tels quels (déjà pourvus, ou introuvables en amont). */
  skipped: string[];
};

/**
 * Complète les tracklists manquantes des albums d'un groupe.
 *
 * @param bandId - UUID du groupe.
 */
export async function fillMissingTracklists(
  bandId: string,
): Promise<TracklistResolution> {
  const rows = await db
    .select({
      id: albums.id,
      title: albums.title,
      releaseGroupId: externalRefs.externalId,
    })
    .from(albums)
    .innerJoin(
      externalRefs,
      and(
        eq(externalRefs.entityType, "album"),
        eq(externalRefs.entityId, albums.id),
        eq(externalRefs.provider, "musicbrainz"),
      ),
    )
    .where(eq(albums.bandId, bandId));

  const result: TracklistResolution = {
    filled: 0,
    tracks: 0,
    durations: 0,
    skipped: [],
  };

  for (const album of rows) {
    const existing = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        durationMs: tracks.durationMs,
      })
      .from(tracks)
      .where(eq(tracks.albumId, album.id));

    let upstream;
    try {
      upstream = await listReleaseGroupTracks(album.releaseGroupId);
    } catch {
      result.skipped.push(album.title);
      continue;
    }
    if (upstream.length === 0) {
      result.skipped.push(album.title);
      continue;
    }

    if (existing.length > 0) {
      // Tracklist déjà documentée : on ne touche qu'aux durées absentes.
      // Sans elles, la durée totale d'un album ne peut pas être calculée
      // et la fiche affiche des tirets à la place des minutes.
      //
      // L'appariement se fait sur le TITRE et non sur le numéro de piste :
      // l'édition retenue en amont peut différer de celle documentée ici
      // (rééditions, titres bonus, intros séparées), et un appariement
      // positionnel attribue alors des durées d'un autre morceau. Sans
      // correspondance de titre, la durée reste vide — une donnée absente
      // vaut mieux qu'une donnée fausse dans une encyclopédie.
      const byTitle = new Map(
        upstream.map((t) => [normalizeTitle(t.title), t]),
      );
      for (const track of existing) {
        if (track.durationMs !== null) continue;
        const match = byTitle.get(normalizeTitle(track.title));
        if (!match?.durationMs) continue;
        await db
          .update(tracks)
          .set({ durationMs: match.durationMs, updatedAt: new Date() })
          .where(eq(tracks.id, track.id));
        result.durations += 1;
      }
      continue;
    }

    await db.insert(tracks).values(
      upstream.map((t) => ({
        albumId: album.id,
        title: t.title,
        trackNumber: t.trackNumber,
        discNumber: t.discNumber,
        durationMs: t.durationMs,
      })),
    );
    result.filled += 1;
    result.tracks += upstream.length;
  }

  return result;
}

/**
 * Forme comparable d'un titre de piste.
 *
 * Les catalogues divergent sur la ponctuation et la casse (« Cosmic Keys
 * to My Creations & Times » contre « Cosmic Keys To My Creations and
 * Times ») : on compare des lettres et des chiffres, rien d'autre.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}
