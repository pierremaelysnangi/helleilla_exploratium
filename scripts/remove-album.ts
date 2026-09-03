/**
 * Retire une sortie du catalogue, par son slug et celui de son groupe.
 *
 * Complète `dedupe:albums`, qui ne sait traiter que les vrais doublons —
 * même titre ET même type. Certaines sorties doivent partir pour une
 * raison éditoriale : un EP promotionnel que MusicBrainz distingue mais
 * que l'encyclopédie ne retient pas, une entrée fautive en amont.
 *
 * Toujours en deux temps : le script montre ce qu'il supprimerait, et
 * n'agit qu'avec `--apply`. Une suppression emporte les pistes, les
 * références externes, les genres propres et les critiques rattachées.
 *
 *   pnpm album:remove <band-slug> <album-slug>
 *   pnpm album:remove <band-slug> <album-slug> --apply
 */

import { db } from "@/db";
import {
  albums,
  albumGenres,
  bands,
  externalRefs,
  pressReviews,
  tracks,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

const APPLY = process.argv.includes("--apply");
const [bandSlug, albumSlug] = process.argv
  .slice(2)
  .filter((a) => a !== "--apply");

async function main() {
  if (!bandSlug || !albumSlug) {
    console.error(
      "Usage : pnpm album:remove <band-slug> <album-slug> [--apply]",
    );
    process.exit(1);
  }

  const [row] = await db
    .select({
      id: albums.id,
      title: albums.title,
      type: albums.type,
      releaseYear: albums.releaseYear,
      bandName: bands.name,
      trackCount: sql<number>`(
        select count(*)::int from ${tracks} where ${tracks.albumId} = ${albums.id}
      )`,
    })
    .from(albums)
    .innerJoin(bands, eq(bands.id, albums.bandId))
    .where(and(eq(bands.slug, bandSlug), eq(albums.slug, albumSlug)))
    .limit(1);

  if (!row) {
    console.error(`Aucune sortie « ${albumSlug} » chez « ${bandSlug} ».`);
    process.exit(1);
  }

  console.info(
    `${row.bandName} — ${row.title} (${row.type}, ${row.releaseYear ?? "?"})`,
  );

  if (!APPLY) {
    console.info("Relancer avec --apply pour supprimer.");
    process.exit(0);
  }

  await db.delete(tracks).where(eq(tracks.albumId, row.id));
  await db.delete(albumGenres).where(eq(albumGenres.albumId, row.id));
  await db.delete(pressReviews).where(eq(pressReviews.albumId, row.id));
  await db
    .delete(externalRefs)
    .where(
      and(
        eq(externalRefs.entityType, "album"),
        eq(externalRefs.entityId, row.id),
      ),
    );
  await db.delete(albums).where(eq(albums.id, row.id));

  console.info("Supprimée.");
  process.exit(0);
}

void main();
