/**
 * Fabrique de données de test E2E.
 * Chaque fixture génère des valeurs uniques (suffixe aléatoire) pour
 * éviter les collisions d'unicité entre exécutions et entre specs.
 */

/** Suffixe unique par spec/exécution. */
const RUN_ID = Math.random().toString(36).slice(2, 8);

/** Corps valide de création d'un groupe. */
export function bandPayload(name = `Band-${RUN_ID}-${rnd()}`) {
  return {
    name,
    slug: name.toLowerCase(),
    countryCode: "FR",
    formedYear: 1995,
    bio: `Bio de test pour ${name}`,
  };
}

/** Corps valide de création d'un album rattaché à un groupe. */
export function albumPayload(bandId: string) {
  const title = `Album-${RUN_ID}-${rnd()}`;
  return {
    bandId,
    title,
    slug: title.toLowerCase(),
    type: "album" as const,
    releaseYear: 2001,
  };
}

/** Corps valide de création d'une piste rattachée à un album. */
export function trackPayload(albumId: string, trackNumber = 1) {
  return {
    albumId,
    title: `Track-${RUN_ID}-${rnd()}`,
    trackNumber,
    discNumber: 1,
    durationMs: 240_000,
  };
}

/** Corps valide de création d'un genre. */
export function genrePayload(name = `Genre-${RUN_ID}-${rnd()}`) {
  return { name, slug: name.toLowerCase() };
}

/** Chaîne aléatoire courte. */
function rnd() {
  return Math.random().toString(36).slice(2, 6);
}
