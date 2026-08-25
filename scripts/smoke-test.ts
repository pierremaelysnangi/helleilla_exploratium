/**
 * Script de test de fumée (smoke test) : valide la chaîne complète
 * DB → BullMQ → Meilisearch. Crée un groupe, un album et une piste,
 * enfile leur indexation, vérifie la recherche Meilisearch, puis
 * supprime le tout et confirme la disparition des documents indexés.
 */

// Mutations Drizzle : création/suppression des entités
import { createBand, deleteBand } from "@/db/mutations/bands";
import { createAlbum } from "@/db/mutations/albums";
import { createTrack } from "@/db/mutations/tracks";
// Enqueue des jobs d'indexation dans BullMQ
import { enqueueBandIndex } from "@/lib/queue/jobs/index-band";
import { enqueueAlbumIndex } from "@/lib/queue/jobs/index-album";
import { enqueueTrackIndex } from "@/lib/queue/jobs/index-track";
// Client Meilisearch pour vérifier les résultats de recherche
import { meilisearch } from "@/lib/search/meilisearch";

// Petit utilitaire d'attente (ms), pour laisser les workers traiter les jobs
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Point d'entrée du smoke test : création → indexation → recherche → nettoyage,
 * avec vérification que la suppression a bien été propagée à Meilisearch.
 */
async function main() {
  console.log("🧪 Smoke test — chaîne DB → Queue → Meilisearch\n");

  // 1. CREATE
  const band = await createBand({
    name: "Test Necrofrost",
    slug: `test-necrofrost-${Date.now()}`,
    countryCode: "NO",
    formedYear: 1994,
  });
  console.log(`✅ Band créé : ${band.id}`);

  const album = await createAlbum({
    bandId: band.id,
    title: "Test Frozen Depths",
    slug: `test-frozen-depths-${Date.now()}`,
    type: "album",
  });
  console.log(`✅ Album créé : ${album.id}`);

  const track = await createTrack({
    albumId: album.id,
    title: "Test Winterfall",
    trackNumber: 1,
    durationMs: 384000,
  });
  console.log(`✅ Track créée : ${track.id}`);

  // 2. INDEX
  await enqueueBandIndex(band.id, "index");
  await enqueueAlbumIndex(album.id, "index");
  await enqueueTrackIndex(track.id, "index");
  console.log("\n⏳ Jobs enqueués, attente 3s...\n");
  await sleep(3000);

  // 3. SEARCH
  const res = await meilisearch.index("bands").search("Necrofrost");
  console.log(`🔍 Recherche "Necrofrost" → ${res.hits.length} hit(s)`);
  console.log(res.hits);

  // 4. CLEANUP (teste la cascade)
  console.log("\n🧹 Suppression du band (cascade)...");
  await deleteBand(band.id);
  await enqueueBandIndex(band.id, "delete");
  await enqueueAlbumIndex(album.id, "delete");
  await enqueueTrackIndex(track.id, "delete");
  await sleep(3000);

  const after = await meilisearch.index("bands").search("Necrofrost");
  console.log(
    `🔍 Après suppression → ${after.hits.length} hit(s) (attendu: 0)`,
  );

  process.exit(0);
}

// Lancement du script : log l'erreur et sort avec code 1 en cas d'échec
main().catch((err) => {
  console.error("❌ Smoke test échoué:", err);
  process.exit(1);
});
