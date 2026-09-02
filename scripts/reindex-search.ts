/**
 * Réindexe entièrement Meilisearch depuis la base.
 *
 *   pnpm search:reindex
 *
 * À lancer après un seed, une restauration, ou quand l'index a dérivé.
 * L'indexation courante passe par BullMQ (un job par écriture) et suppose
 * qu'un worker tourne : rien ne rattrape les écritures faites hors de ce
 * chemin — c'est précisément le cas du seed, qui écrit en base directement.
 *
 * Écrit en lots : envoyer 40 documents un par un multiplierait les
 * allers-retours pour rien, et Meilisearch indexe de façon asynchrone.
 */

import { db } from "@/db";
import { bands, albums, tracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { meilisearch, INDEXES } from "@/lib/search/meilisearch";
import {
  bandDocument,
  albumDocument,
  trackDocument,
} from "@/lib/search/documents";

/** Taille de lot : compromis entre nombre de requêtes et poids du corps. */
const BATCH = 500;

/**
 * Envoie une collection dans son index, par lots.
 *
 * @returns Le nombre de documents transmis.
 */
async function pushAll<T>(
  indexName: string,
  rows: T[],
  project: (row: T) => Record<string, unknown>,
): Promise<number> {
  if (rows.length === 0) return 0;
  const index = meilisearch.index(indexName);
  for (let i = 0; i < rows.length; i += BATCH) {
    await index.addDocuments(rows.slice(i, i + BATCH).map(project), {
      primaryKey: "id",
    });
  }
  return rows.length;
}

async function main() {
  console.log("Réindexation Meilisearch depuis la base\n");

  // Les albums et les pistes sont lus AVEC leur contexte : un document
  // indexé doit porter de quoi bâtir un lien band-scopé et afficher une
  // pochette. La jointure remplace trois requêtes par entité.
  const [bandRows, albumRows, trackRows] = await Promise.all([
    db.select().from(bands),
    db
      .select({ album: albums, band: bands })
      .from(albums)
      .innerJoin(bands, eq(bands.id, albums.bandId)),
    db
      .select({ track: tracks, album: albums, band: bands })
      .from(tracks)
      .innerJoin(albums, eq(albums.id, tracks.albumId))
      .innerJoin(bands, eq(bands.id, albums.bandId)),
  ]);

  const counts = {
    bands: await pushAll(INDEXES.bands, bandRows, bandDocument),
    albums: await pushAll(INDEXES.albums, albumRows, (row) =>
      albumDocument(row.album, row.band),
    ),
    tracks: await pushAll(INDEXES.tracks, trackRows, (row) =>
      trackDocument(row.track, row.album, row.band),
    ),
  };

  for (const [name, n] of Object.entries(counts)) {
    console.log(`  ${String(n).padStart(5)} ${name}`);
  }

  // Meilisearch indexe de façon asynchrone : sans cette attente, une
  // recherche lancée juste après pourrait encore renvoyer l'ancien état.
  console.log("\nAttente de la fin des tâches d'indexation…");
  const tasks = await meilisearch.tasks.getTasks({
    statuses: ["enqueued", "processing"],
  });
  for (const task of tasks.results) {
    await meilisearch.tasks.waitForTask(task.uid, { timeout: 30_000 });
  }

  console.log("Index à jour.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Réindexation échouée :", err);
  process.exit(1);
});
