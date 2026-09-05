/**
 * @file Lecture de la presse et des médias, groupés par pays.
 *
 * Même axe que les festivals, pour la même raison : devant une telle
 * liste, la question qu'on se pose est « qu'est-ce qui se lit près de
 * chez moi, ou dans une langue que je lis ».
 */

import { db } from "@/db";
import { mediaOutlets } from "@/db/schema";
import { asc } from "drizzle-orm";

export type MediaOutlet = typeof mediaOutlets.$inferSelect;

/** Un pays et les médias qui y paraissent. */
export type OutletsByCountry = {
  countryCode: string;
  outlets: MediaOutlet[];
};

/**
 * Tous les médias, groupés par pays.
 *
 * Les pays sont ordonnés par nombre de titres décroissant : un tri
 * alphabétique ouvrirait la page sur l'Allemagne et enterrerait les
 * scènes les mieux documentées.
 */
export async function listOutletsByCountry(): Promise<OutletsByCountry[]> {
  const rows = await db
    .select()
    .from(mediaOutlets)
    // Magazines et webzines mêlés, triés par nom : c'est le pays qui
    // structure la page, pas le format.
    .orderBy(asc(mediaOutlets.name));

  const grouped = new Map<string, MediaOutlet[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.countryCode);
    if (bucket) bucket.push(row);
    else grouped.set(row.countryCode, [row]);
  }

  return [...grouped.entries()]
    .map(([countryCode, outlets]) => ({ countryCode, outlets }))
    .sort(
      (a, b) =>
        b.outlets.length - a.outlets.length ||
        a.countryCode.localeCompare(b.countryCode),
    );
}
