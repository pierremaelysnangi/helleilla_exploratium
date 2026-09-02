/**
 * Résout les pochettes d'album depuis Cover Art Archive.
 *
 *   pnpm covers:sync           # groupes sans pochettes seulement
 *   pnpm covers:sync --all     # réexamine tous les groupes
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
    `Résolution des pochettes — ${targets.length} groupe(s)\n` +
      "Source : Cover Art Archive (MusicBrainz), publique et sans jeton.\n",
  );

  let matched = 0;
  let covered = 0;

  for (const band of targets) {
    const mbid = await getBandMusicbrainzId(band.id);
    if (!mbid) {
      console.log(`  ${band.name} — aucune référence MusicBrainz, ignoré`);
      continue;
    }

    try {
      const result = await resolveAlbumCoversForBand(band.id, mbid);
      matched += result.matched;
      covered += result.covered;
      const skipped = result.skipped.length
        ? ` · sans visuel : ${result.skipped.join(", ")}`
        : "";
      console.log(
        `  ${band.name} — ${result.covered}/${result.matched} pochettes${skipped}`,
      );
    } catch (err) {
      // Une panne sur un groupe ne doit pas interrompre les suivants
      console.log(
        `  ${band.name} — échec : ${err instanceof Error ? err.message.slice(0, 90) : "erreur"}`,
      );
    }
  }

  console.log(
    `\n${covered} pochette(s) rattachée(s) sur ${matched} album(s) appariés.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Résolution échouée :", err);
  process.exit(1);
});
