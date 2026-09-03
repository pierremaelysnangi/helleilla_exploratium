/**
 * Supprime les sorties en double d'un même groupe.
 *
 * Ces doublons proviennent d'une version antérieure de l'import de
 * discographie, dont l'index des œuvres connues n'était pas mis à jour
 * après chaque création : deux release-groups MusicBrainz indiscernables
 * produisaient alors deux fiches locales pour la même œuvre.
 *
 * Le défaut est corrigé (`lib/media/discography.ts`), mais les lignes
 * déjà écrites subsistent. Ce script les nettoie.
 *
 * Critère de conservation : la fiche la MIEUX renseignée — d'abord le
 * nombre de pistes, puis la présence d'une année, puis la pochette.
 * Jamais l'ordre d'insertion, qui ne dit rien de la qualité.
 *
 *   pnpm dedupe:albums            # liste ce qui serait supprimé
 *   pnpm dedupe:albums --apply    # supprime réellement
 */

import { db } from "@/db";
import { albums, tracks, externalRefs, albumGenres } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

const APPLY = process.argv.includes("--apply");

async function main() {
  // Groupes de doublons : même groupe, même titre, même type
  const groups = await db
    .select({
      bandId: albums.bandId,
      title: albums.title,
      type: albums.type,
      count: sql<number>`count(*)::int`,
    })
    .from(albums)
    .groupBy(albums.bandId, albums.title, albums.type)
    .having(sql`count(*) > 1`);

  if (groups.length === 0) {
    console.info("Aucun doublon.");
    process.exit(0);
  }

  const doomed: { id: string; title: string; slug: string }[] = [];

  for (const group of groups) {
    const rows = await db
      .select({
        id: albums.id,
        slug: albums.slug,
        title: albums.title,
        releaseYear: albums.releaseYear,
        coverUrl: albums.coverUrl,
      })
      .from(albums)
      .where(
        and(
          eq(albums.bandId, group.bandId),
          eq(albums.title, group.title),
          eq(albums.type, group.type),
        ),
      );

    // Comptage des pistes en une requête groupée plutôt qu'en
    // sous-requête corrélée : la corrélation sur `albums.id` n'est pas
    // exprimable telle quelle depuis le constructeur de requête.
    const counts = await db
      .select({
        albumId: tracks.albumId,
        value: sql<number>`count(*)::int`,
      })
      .from(tracks)
      .where(
        inArray(
          tracks.albumId,
          rows.map((r) => r.id),
        ),
      )
      .groupBy(tracks.albumId);

    const byAlbum = new Map(counts.map((c) => [c.albumId, c.value]));
    const candidates = rows.map((r) => ({
      ...r,
      trackCount: byAlbum.get(r.id) ?? 0,
    }));

    // Tri décroissant sur la richesse : le premier est conservé
    const ranked = [...candidates].sort(
      (a, b) =>
        b.trackCount - a.trackCount ||
        Number(b.releaseYear !== null) - Number(a.releaseYear !== null) ||
        Number(Boolean(b.coverUrl)) - Number(Boolean(a.coverUrl)),
    );

    const [kept, ...rest] = ranked;
    console.info(
      `${group.title} (${group.type}) — conservé : ${kept.slug} ` +
        `[${kept.trackCount} pistes]`,
    );
    for (const r of rest) {
      console.info(`    supprimé : ${r.slug} [${r.trackCount} pistes]`);
      doomed.push({ id: r.id, title: r.title, slug: r.slug });
    }
  }

  if (!APPLY) {
    console.info(
      `\n${doomed.length} sortie(s) seraient supprimées. ` +
        "Relancer avec --apply pour appliquer.",
    );
    process.exit(0);
  }

  const ids = doomed.map((d) => d.id);
  // Les clés étrangères sont en cascade, mais l'ordre explicite rend le
  // script lisible et indépendant de la configuration du schéma.
  await db.delete(tracks).where(inArray(tracks.albumId, ids));
  await db.delete(albumGenres).where(inArray(albumGenres.albumId, ids));
  await db
    .delete(externalRefs)
    .where(
      and(
        eq(externalRefs.entityType, "album"),
        inArray(externalRefs.entityId, ids),
      ),
    );
  await db.delete(albums).where(inArray(albums.id, ids));

  console.info(`\n${ids.length} sortie(s) supprimée(s).`);
  process.exit(0);
}

void main();
