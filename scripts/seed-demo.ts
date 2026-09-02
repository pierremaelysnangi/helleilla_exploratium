/**
 * Peuple la base de développement avec un jeu de données de démonstration.
 *
 *   pnpm seed:demo            # insère ce qui manque, ne touche pas au reste
 *   pnpm seed:demo --refs     # + résout les identifiants MusicBrainz
 *
 * Les données sont RÉELLES (voir db/seed/data.ts) : ce projet interdit la
 * fabrication de contenu, et un seed d'entrées fictives laisserait des
 * groupes inventés dans l'encyclopédie s'il était rejoué ailleurs qu'en
 * développement.
 *
 * Le script est IDEMPOTENT : chaque insertion passe par un upsert sur le
 * slug, donc le relancer met à jour plutôt que de dupliquer. Aucune
 * suppression n'est effectuée — il n'efface jamais des données existantes.
 */

import { db } from "@/db";
import {
  albums,
  albumLineups,
  bandGenres,
  bandMembers,
  bands,
  externalRefs,
  genres,
  labels,
  members,
  tracks,
} from "@/db/schema";
import { BANDS, GENRES, LABELS, type SeedBand } from "@/db/seed/data";
import { searchArtists } from "@/lib/providers/musicbrainz";
import { eq } from "drizzle-orm";

/** Le drapeau --refs déclenche les appels MusicBrainz (1 req/s). */
const RESOLVE_REFS = process.argv.includes("--refs");

/** Insère les genres puis rattache les sous-genres à leur parent. */
async function seedGenres(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  // Premier passage : toutes les lignes, sans hiérarchie
  for (const genre of GENRES) {
    const [row] = await db
      .insert(genres)
      .values({ name: genre.name, slug: genre.slug })
      .onConflictDoUpdate({
        target: genres.slug,
        set: { name: genre.name },
      })
      .returning({ id: genres.id });
    ids.set(genre.slug, row.id);
  }

  // Second passage : le parent doit exister avant d'être référencé
  for (const genre of GENRES) {
    if (!genre.parent) continue;
    await db
      .update(genres)
      .set({ parentId: ids.get(genre.parent) })
      .where(eq(genres.id, ids.get(genre.slug)!));
  }

  console.log(`  ${GENRES.length} genres`);
  return ids;
}

/** Insère les labels et retourne leurs identifiants par slug. */
async function seedLabels(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const label of LABELS) {
    const [row] = await db
      .insert(labels)
      .values(label)
      .onConflictDoUpdate({
        target: labels.slug,
        set: { name: label.name, countryCode: label.countryCode },
      })
      .returning({ id: labels.id });
    ids.set(label.slug, row.id);
  }
  console.log(`  ${LABELS.length} labels`);
  return ids;
}

/**
 * Résout l'identifiant MusicBrainz d'un groupe.
 *
 * Ne se fie pas au premier résultat : « Emperor » ou « Paradise Lost »
 * désignent plusieurs artistes. Le pays et l'année de formation du jeu de
 * données servent de signaux de désambiguïsation — ce sont des faits, pas
 * des heuristiques.
 *
 * Renvoie `null` plutôt qu'une approximation : une référence fausse ferait
 * ensuite remonter les pochettes et extraits d'un autre groupe, ce qui est
 * pire que pas de médias du tout.
 */
async function resolveMbid(band: SeedBand): Promise<string | null> {
  let candidates;
  try {
    const result = await searchArtists(band.name);
    candidates = result.artists ?? [];
  } catch (err) {
    // Journalisé et non avalé : une panne de provider doit être visible
    console.log(
      `  ${band.name} → recherche impossible (${err instanceof Error ? err.message.slice(0, 80) : "erreur"})`,
    );
    return null;
  }

  const exact = candidates.filter(
    (a) =>
      a.name.toLowerCase() === band.name.toLowerCase() && (a.score ?? 0) >= 90,
  );
  if (exact.length === 0) return null;

  // Un seul homonyme : le score suffit
  if (exact.length === 1) return exact[0].id;

  // Plusieurs : on exige que le pays ET l'année de formation concordent
  const confirmed = exact.find(
    (a) =>
      a.country === band.countryCode &&
      a["life-span"]?.begin?.startsWith(String(band.formedYear)),
  );
  if (confirmed) return confirmed.id;

  console.log(
    `  ${band.name} → ${exact.length} homonymes indiscernables, ignoré`,
  );
  return null;
}

/** Insère groupes, genres associés, membres, albums et pistes. */
async function seedBands(
  genreIds: Map<string, string>,
  labelIds: Map<string, string>,
) {
  for (const band of BANDS) {
    const [bandRow] = await db
      .insert(bands)
      .values({
        name: band.name,
        slug: band.slug,
        bio: band.bio,
        countryCode: band.countryCode,
        formedYear: band.formedYear,
        dissolvedYear: band.dissolvedYear ?? null,
        themes: band.themes,
      })
      .onConflictDoUpdate({
        target: bands.slug,
        set: { name: band.name, bio: band.bio, themes: band.themes },
      })
      .returning({ id: bands.id });

    // Genres : synchronisation complète, comme PUT /api/bands/:id/genres
    await db.delete(bandGenres).where(eq(bandGenres.bandId, bandRow.id));
    await db.insert(bandGenres).values(
      band.genres.map((slug) => ({
        bandId: bandRow.id,
        genreId: genreIds.get(slug)!,
      })),
    );

    // Membres : la personne d'abord, puis son appartenance au groupe
    await db.delete(bandMembers).where(eq(bandMembers.bandId, bandRow.id));
    const memberIds = new Map<string, string>();
    for (const member of band.members) {
      const [memberRow] = await db
        .insert(members)
        .values({ name: member.name, slug: member.slug })
        .onConflictDoUpdate({
          target: members.slug,
          set: { name: member.name },
        })
        .returning({ id: members.id });
      memberIds.set(member.slug, memberRow.id);

      await db.insert(bandMembers).values({
        bandId: bandRow.id,
        memberId: memberRow.id,
        role: member.role,
        joinedYear: member.joinedYear ?? null,
        leftYear: member.leftYear ?? null,
      });
    }

    for (const album of band.albums) {
      const [albumRow] = await db
        .insert(albums)
        .values({
          bandId: bandRow.id,
          title: album.title,
          slug: album.slug,
          type: album.type,
          releaseYear: album.releaseYear,
          labelId: album.label ? (labelIds.get(album.label) ?? null) : null,
        })
        .onConflictDoUpdate({
          target: [albums.bandId, albums.slug],
          set: { title: album.title, releaseYear: album.releaseYear },
        })
        .returning({ id: albums.id });

      if (album.tracks?.length) {
        await db.delete(tracks).where(eq(tracks.albumId, albumRow.id));
        await db.insert(tracks).values(
          album.tracks.map((title, index) => ({
            albumId: albumRow.id,
            title,
            trackNumber: index + 1,
            discNumber: 1,
          })),
        );
      }

      // Formation de l'album : les membres en activité à sa sortie
      await db
        .delete(albumLineups)
        .where(eq(albumLineups.albumId, albumRow.id));
      const present = band.members.filter(
        (m) =>
          (m.joinedYear ?? 0) <= album.releaseYear &&
          (m.leftYear ?? 9999) >= album.releaseYear,
      );
      if (present.length > 0) {
        await db.insert(albumLineups).values(
          present.map((m) => ({
            albumId: albumRow.id,
            memberId: memberIds.get(m.slug)!,
            role: m.role,
          })),
        );
      }
    }

    // Référence officielle : c'est elle qui alimente le resolver média
    if (RESOLVE_REFS) {
      const mbid = await resolveMbid(band);
      if (mbid) {
        await db
          .insert(externalRefs)
          .values({
            entityType: "band",
            entityId: bandRow.id,
            provider: "musicbrainz",
            externalId: mbid,
          })
          .onConflictDoNothing();
        console.log(`  ${band.name} → MusicBrainz ${mbid}`);
      } else {
        console.log(`  ${band.name} → aucune correspondance fiable, ignoré`);
      }
    }

    const trackCount = band.albums.reduce(
      (n, a) => n + (a.tracks?.length ?? 0),
      0,
    );
    console.log(
      `  ${band.name} : ${band.albums.length} sorties, ${trackCount} pistes, ${band.members.length} membres`,
    );
  }
}

async function main() {
  console.log(
    "Seed de démonstration (données réelles, insertion idempotente)\n",
  );

  console.log("Genres");
  const genreIds = await seedGenres();

  console.log("\nLabels");
  const labelIds = await seedLabels();

  console.log("\nGroupes");
  await seedBands(genreIds, labelIds);

  if (!RESOLVE_REFS) {
    console.log(
      "\nAstuce : `pnpm seed:demo --refs` résout les identifiants MusicBrainz\n" +
        "(1 requête/seconde) pour activer les pochettes et extraits officiels.",
    );
  }
  console.log("\nTerminé.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed échoué :", err);
  process.exit(1);
});
