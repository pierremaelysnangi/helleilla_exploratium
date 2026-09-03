/**
 * Insère les festivals et salles de référence.
 *
 * Idempotent : l'upsert porte sur le slug, si bien que relancer le
 * script met à jour plutôt que de dupliquer. Les corrections apportées à
 * `db/seed/venues.ts` atteignent donc la base.
 *
 *   pnpm seed:venues
 */

import { db } from "@/db";
import { venues } from "@/db/schema";
import { VENUES } from "@/db/seed/venues";

async function main() {
  for (const venue of VENUES) {
    await db
      .insert(venues)
      .values({
        name: venue.name,
        slug: venue.slug,
        kind: venue.kind,
        countryCode: venue.countryCode,
        city: venue.city ?? null,
        foundedYear: venue.foundedYear ?? null,
        endedYear: venue.endedYear ?? null,
        websiteUrl: venue.websiteUrl ?? null,
        capacity: venue.capacity ?? null,
        description: venue.description ?? null,
        descriptionTranslations: venue.descriptionTranslations ?? {},
      })
      .onConflictDoUpdate({
        target: venues.slug,
        set: {
          name: venue.name,
          kind: venue.kind,
          countryCode: venue.countryCode,
          city: venue.city ?? null,
          foundedYear: venue.foundedYear ?? null,
          endedYear: venue.endedYear ?? null,
          websiteUrl: venue.websiteUrl ?? null,
          capacity: venue.capacity ?? null,
          description: venue.description ?? null,
          descriptionTranslations: venue.descriptionTranslations ?? {},
          updatedAt: new Date(),
        },
      });
  }

  const byCountry = new Map<string, number>();
  for (const v of VENUES) {
    byCountry.set(v.countryCode, (byCountry.get(v.countryCode) ?? 0) + 1);
  }

  console.info(
    `${VENUES.length} lieu(x) dans ${byCountry.size} pays :\n` +
      [...byCountry.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([code, n]) => `  ${code} ${n}`)
        .join("\n"),
  );
  process.exit(0);
}

void main();
