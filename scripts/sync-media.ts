/**
 * Enrichit le catalogue depuis les sources officielles.
 *
 *   pnpm media:sync                 # groupes incomplets seulement
 *   pnpm media:sync --all           # réexamine tous les groupes
 *   pnpm media:sync --discography   # + importe les sorties manquantes
 *
 * Quatre résolutions dans une seule passe, parce qu'elles partagent la
 * même référence MusicBrainz et le même budget de requêtes (1/seconde) :
 *   0. discographie manquante (MusicBrainz) — sur demande explicite ;
 *   1. visuel du groupe (Wikidata) ;
 *   2. pochettes d'album (Cover Art Archive) ;
 *   3. tracklists manquantes (MusicBrainz).
 *
 * L'import de discographie est opt-in parce qu'il CRÉE des lignes, là où
 * les trois autres étapes se contentent de compléter des champs vides.
 * Il vient en premier pour que les sorties nouvellement créées reçoivent
 * leur pochette et leur tracklist dans la même passe.
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
import { and, eq, isNull, count } from "drizzle-orm";
import {
  resolveAlbumCoversForBand,
  getBandMusicbrainzId,
} from "@/lib/media/albumCovers";
import { resolveBandImage } from "@/lib/media/bandImages";
import { fillMissingTracklists } from "@/lib/media/tracklists";
import { importDiscographyForBand } from "@/lib/media/discography";

const ALL = process.argv.includes("--all");
/** Import de discographie : opt-in, car il crée des lignes en base. */
const DISCOGRAPHY = process.argv.includes("--discography");

/** Groupes à traiter : tous, ou seulement ceux dont un album manque de visuel. */
async function targetBands() {
  const all = await db
    .select({ id: bands.id, name: bands.name })
    .from(bands)
    .orderBy(bands.name);

  // Une lacune de discographie ne se voit pas en base : seule
  // MusicBrainz sait ce qui manque. L'import porte donc sur tous les
  // groupes, quel que soit l'état local de leurs pochettes.
  if (ALL || DISCOGRAPHY) return all;

  const withGaps: typeof all = [];
  for (const band of all) {
    // Les deux comptages sont bornés au groupe : sans le `bandId` sur le
    // second, une seule pochette manquante ailleurs dans le catalogue
    // faisait retenir TOUS les groupes, et l'option perdait son sens.
    const [total] = await db
      .select({ value: count() })
      .from(albums)
      .where(eq(albums.bandId, band.id));
    const [missing] = await db
      .select({ value: count() })
      .from(albums)
      .where(and(eq(albums.bandId, band.id), isNull(albums.coverUrl)));

    if ((total?.value ?? 0) > 0 && (missing?.value ?? 0) > 0) {
      withGaps.push(band);
    }
  }
  return withGaps;
}

async function main() {
  const targets = await targetBands();
  console.log(
    `Enrichissement du catalogue — ${targets.length} groupe(s)\n` +
      "Sources : MusicBrainz, Wikidata et Cover Art Archive — publiques,\n" +
      "sans jeton, limitées à une requête par seconde.\n" +
      (DISCOGRAPHY
        ? "Import de discographie ACTIF : tous les types de sortie.\n"
        : "") +
      "\n",
  );

  let covered = 0;
  let images = 0;
  let filledAlbums = 0;
  let newTracks = 0;
  let filledDurations = 0;
  let newAlbums = 0;

  for (const band of targets) {
    const mbid = await getBandMusicbrainzId(band.id);
    if (!mbid) {
      console.log(`  ${band.name} — aucune référence MusicBrainz, ignoré`);
      continue;
    }

    // Chaque étape est isolée : une source indisponible ne doit pas
    // priver le groupe des autres enrichissements.
    const parts: string[] = [];

    if (DISCOGRAPHY) {
      try {
        const disco = await importDiscographyForBand(band.id, mbid);
        newAlbums += disco.imported;
        if (disco.imported > 0) {
          parts.push(`${disco.imported} sortie(s) importée(s)`);
        }
        if (disco.retyped > 0) {
          parts.push(`${disco.retyped} reclassée(s) en split`);
        }
        if (disco.skipped.length > 0) {
          parts.push(`${disco.skipped.length} écartée(s)`);
        }
      } catch (err) {
        parts.push(
          `discographie en échec (${err instanceof Error ? err.message.slice(0, 50) : "erreur"})`,
        );
      }
    }

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
      filledDurations += lists.durations;
      if (lists.filled > 0) {
        parts.push(`${lists.tracks} pistes sur ${lists.filled} album(s)`);
      }
      if (lists.durations > 0) {
        parts.push(`${lists.durations} durée(s) complétée(s)`);
      }
    } catch {
      parts.push("tracklists en échec");
    }

    console.log(`  ${band.name} — ${parts.join(" · ")}`);
  }

  console.log(
    "\n" +
      (DISCOGRAPHY ? `${newAlbums} sortie(s) importée(s) · ` : "") +
      `${images} visuel(s) de groupe · ${covered} pochette(s) · ` +
      `${newTracks} piste(s) sur ${filledAlbums} album(s) · ` +
      `${filledDurations} durée(s) complétée(s).\n` +
      "Pensez à `pnpm search:reindex` pour répercuter dans la recherche.",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Résolution échouée :", err);
  process.exit(1);
});
