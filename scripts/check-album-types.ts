/**
 * Compare le type de chaque sortie à celui déclaré par MusicBrainz.
 *
 * Le type conditionne la section dans laquelle une sortie apparaît :
 * ranger un album studio parmi les EP, ou un split parmi les albums,
 * fausse la lecture d'une discographie. « Morbid Tales » figurait ainsi
 * en EP alors que MusicBrainz et l'édition américaine en font un album.
 *
 * Le script se contente de RAPPORTER : la concordance n'est pas toujours
 * une erreur — un mini-LP peut légitimement être décrit d'un côté comme
 * un EP et de l'autre comme un album, et l'encyclopédie a le droit de
 * trancher. `--apply` n'aligne que les cas où l'amont est catégorique et
 * l'écart manifeste : les SPLITS, qu'un seul groupe ne peut revendiquer.
 *
 *   pnpm check:album-types           # rapport seul
 *   pnpm check:album-types --apply   # aligne les splits mal classés
 */

import { db } from "@/db";
import { albums, bands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBandMusicbrainzId } from "@/lib/media/albumCovers";
import {
  listReleaseGroups,
  matchReleaseGroup,
  albumTypeOf,
} from "@/lib/providers/coverart";

const APPLY = process.argv.includes("--apply");

async function main() {
  const allBands = await db
    .select({ id: bands.id, name: bands.name })
    .from(bands)
    .orderBy(bands.name);

  let checked = 0;
  let diverging = 0;
  let fixed = 0;

  for (const band of allBands) {
    const mbid = await getBandMusicbrainzId(band.id);
    if (!mbid) continue;

    const [groups, rows] = await Promise.all([
      listReleaseGroups(mbid),
      db
        .select({
          id: albums.id,
          title: albums.title,
          type: albums.type,
          releaseYear: albums.releaseYear,
        })
        .from(albums)
        .where(eq(albums.bandId, band.id)),
    ]);

    for (const album of rows) {
      const group = matchReleaseGroup(groups, album);
      if (!group) continue;

      const upstream = albumTypeOf(group);
      checked += 1;
      if (!upstream || upstream === album.type) continue;

      diverging += 1;
      const mark = upstream === "split" ? "  ← corrigeable" : "";
      console.info(
        `  ${band.name} — ${album.title} : ${album.type} ici, ` +
          `${upstream} chez MusicBrainz${mark}`,
      );

      if (APPLY && upstream === "split") {
        await db
          .update(albums)
          .set({ type: "split", updatedAt: new Date() })
          .where(eq(albums.id, album.id));
        fixed += 1;
      }
    }
  }

  console.info(
    `\n${checked} sortie(s) comparée(s), ${diverging} divergence(s)` +
      (APPLY ? `, ${fixed} split(s) corrigé(s).` : "."),
  );
  if (!APPLY && diverging > 0) {
    console.info(
      "Les divergences autres que les splits relèvent d'un choix " +
        "éditorial : à trancher à la main dans db/seed/data.ts.",
    );
  }
  process.exit(0);
}

void main();
