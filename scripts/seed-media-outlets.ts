/**
 * Peuple la table `media_outlets` (presse et médias de la scène).
 *
 * Idempotent : chaque titre est identifié par son slug, une seconde
 * exécution met à jour au lieu de dupliquer. Aucune donnée n'est
 * supprimée — un média retiré du jeu de départ reste en base, et c'est
 * volontaire : une entrée peut avoir été ajoutée par la modération.
 */

import { db } from "@/db";
import { mediaOutlets } from "@/db/schema";
import { MEDIA_OUTLETS } from "@/db/seed/mediaOutlets";

async function main() {
  for (const outlet of MEDIA_OUTLETS) {
    await db
      .insert(mediaOutlets)
      .values(outlet)
      .onConflictDoUpdate({
        target: mediaOutlets.slug,
        set: {
          name: outlet.name,
          kind: outlet.kind,
          countryCode: outlet.countryCode,
          websiteUrl: outlet.websiteUrl,
          updatedAt: new Date(),
        },
      });
  }

  const byCountry = new Map<string, number>();
  for (const outlet of MEDIA_OUTLETS) {
    byCountry.set(
      outlet.countryCode,
      (byCountry.get(outlet.countryCode) ?? 0) + 1,
    );
  }

  console.log(`${MEDIA_OUTLETS.length} médias`);
  for (const [country, count] of [...byCountry].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${country} ${count}`);
  }
}

void main().then(() => process.exit(0));
