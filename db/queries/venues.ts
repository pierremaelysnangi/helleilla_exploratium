/**
 * Lectures des festivals et salles.
 *
 * La page les présente groupés par PAYS : c'est l'axe qui répond à la
 * question qu'on se pose vraiment devant une telle liste — « qu'est-ce
 * qu'il y a près de chez moi, ou là où je pars ? ».
 */

import { db } from "@/db";
import { venues } from "@/db/schema";
import { asc } from "drizzle-orm";

export type Venue = typeof venues.$inferSelect;

/** Un pays et les lieux qui s'y trouvent. */
export type VenuesByCountry = {
  countryCode: string;
  venues: Venue[];
};

/**
 * Tous les lieux, groupés par pays.
 *
 * Les pays sont ordonnés par nombre de lieux décroissant : une liste
 * alphabétique ferait ouvrir la page sur l'Australie, où la scène est
 * la moins documentée ici.
 */
export async function listVenuesByCountry(): Promise<VenuesByCountry[]> {
  const rows = await db
    .select()
    .from(venues)
    // Festivals avant salles, puis par nom : l'ordre est stable, et une
    // salle ne doit pas s'intercaler entre deux festivals.
    .orderBy(asc(venues.kind), asc(venues.name));

  const grouped = new Map<string, Venue[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.countryCode);
    if (bucket) bucket.push(row);
    else grouped.set(row.countryCode, [row]);
  }

  return [...grouped.entries()]
    .map(([countryCode, list]) => ({ countryCode, venues: list }))
    .sort(
      (a, b) =>
        b.venues.length - a.venues.length ||
        a.countryCode.localeCompare(b.countryCode),
    );
}
