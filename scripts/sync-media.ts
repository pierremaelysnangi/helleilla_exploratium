/**
 * Enrichit le catalogue depuis les sources officielles.
 *
 *   pnpm media:sync           # groupes incomplets seulement
 *   pnpm media:sync --all     # réexamine tous les groupes
 *
 * Trois résolutions dans une seule passe, parce qu'elles partagent la même
 * référence MusicBrainz et le même budget de requêtes (1 par seconde) :
 *   1. visuel du groupe (Wikidata) ;
 *   2. pochettes d'album (Cover Art Archive) ;
 *   3. tracklists manquantes (MusicBrainz).
 *
 * Séparé du seed : la résolution dépend de services externes et de leur
 * limite de débit (MusicBrainz : 1 requête/seconde). En faire une étape
 * autonome permet de la rejouer sans retoucher aux données, et de la
 * planifier plus tard comme un job BullMQ.
 *
 * Idempotent : réécrit la même URL pour un album déjà pourvu.
 */

import { db } from "@/db";
import { bands, albums } from "@/db/schema";
import { eq, isNull, count } from "drizzle-orm";
import {
  resolveAlbumCoversForBand,
  getBandMusicbrainzId,
} from "@/lib/media/albumCovers";
import { resolveBandImage } from "@/lib/media/bandImages";
import { fillMissingTracklists } from "@/lib/media/tracklists";

const ALL = process.argv.includes("--all");

/** Groupes à traiter : tous, ou seulement ceux dont un album manque de visuel. */
async function targetBands() {
  const all = await db
    .select({ id: bands.id, name: bands.name })
    .from(bands)
    .orderBy(bands.name);
  if (ALL) return all;

  const withGaps: typeof all = [];
  for (const band of all) {
    const [row] = await db
      .select({ value: count() })
      .from(albums)
      .where(eq(albums.bandId, band.id));
    const [missing] = await db
      .select({ value: count() })
      .from(albums)
      .where(isNull(albums.coverUrl));
    if ((row?.value ?? 0) > 0 && (missing?.value ?? 0) > 0) withGaps.push(band);
  }
  return withGaps;
}

async function main() {
  const targets = await targetBands();
  console.log(
    `Enrichissement du catalogue — ${targets.length} groupe(s)\n` +
      "Sources : MusicBrainz, Wikidata et Cover Art Archive — publiques,\n" +
      "sans jeton, limitées à une requête par seconde.\n",
  );

  let covered = 0;
  let images = 0;
  let filledAlbums = 0;
  let newTracks = 0;

  for (const band of targets) {
    const mbid = await getBandMusicbrainzId(band.id);
    if (!mbid) {
      console.log(`  ${band.name} — aucune référence MusicBrainz, ignoré`);
      continue;
    }

    // Chaque étape est isolée : une source indisponible ne doit pas
    // priver le groupe des deux autres enrichissements.
    const parts: string[] = [];

    try {
      const image = await resolveBandImage(band.id, mbid);
      if (image) {
        images += 1;
        parts.push("visuel");
      }
    } catch {
      parts.push("visuel indisponible");
    }

    try {
      const covers = await resolveAlbumCoversForBand(band.id, mbid, band.name);
      covered += covers.covered;
      parts.push(`${covers.covered}/${covers.matched} pochettes`);
    } catch (err) {
      parts.push(
        `pochettes en échec (${err instanceof Error ? err.message.slice(0, 50) : "erreur"})`,
      );
    }

    try {
      const lists = await fillMissingTracklists(band.id);
      filledAlbums += lists.filled;
      newTracks += lists.tracks;
      if (lists.filled > 0) {
        parts.push(`${lists.tracks} pistes sur ${lists.filled} album(s)`);
      }
    } catch {
      parts.push("tracklists en échec");
    }

    console.log(`  ${band.name} — ${parts.join(" · ")}`);
  }

  console.log(
    `\n${images} visuel(s) de groupe · ${covered} pochette(s) · ` +
      `${newTracks} piste(s) sur ${filledAlbums} album(s).\n` +
      "Pensez à `pnpm search:reindex` pour répercuter dans la recherche.",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Résolution échouée :", err);
  process.exit(1);
});
