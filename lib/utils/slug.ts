/**
 * Fabrication de slugs pour les entités importées.
 *
 * Les slugs du seed sont écrits à la main : c'est tenable pour une
 * vingtaine de sorties choisies, pas pour une discographie complète tirée
 * de MusicBrainz. Ce module produit les mêmes formes, en respectant le
 * `slugRegex` partagé par les schémas de validation
 * (`lib/validations/{band,album}.ts`) : minuscules, chiffres et tirets
 * simples, sans tiret en tête ni en fin.
 */

/** Longueur maximale acceptée par les schémas zod (`.max(200)`). */
const MAX_LENGTH = 200;

/**
 * Convertit un titre en slug kebab-case.
 *
 * `&` devient `and` plutôt que d'être supprimé : « Blood & Fire » et
 * « Blood Fire » sont deux titres différents, les confondre produirait
 * une collision silencieuse.
 *
 * @param value - Titre d'origine, éventuellement accentué ou ponctué.
 * @returns Le slug, ou une chaîne vide si le titre ne contient aucun
 *   caractère exploitable (idéogrammes seuls, ponctuation seule…).
 */
export function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      // Diacritiques décomposés par NFD : « Ø » excepté, non décomposable
      .replace(/[̀-ͯ]/g, "")
      .replace(/ø/gi, "o")
      .replace(/æ/gi, "ae")
      .replace(/œ/gi, "oe")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_LENGTH)
      .replace(/-+$/, "")
  );
}

/**
 * Rend un slug unique dans un ensemble déjà pris.
 *
 * Nécessaire pour les albums : `albums_band_slug_uq` porte sur
 * `(band_id, slug)`, et un groupe publie régulièrement deux sorties
 * homonymes — Celtic Frost a un EP et un album « Monotheist ».
 *
 * Le `hint` est essayé en premier parce qu'il porte du sens
 * (`monotheist-ep` se lit, `monotheist-2` non) ; la numérotation n'est
 * qu'un dernier recours.
 *
 * @param base - Slug souhaité.
 * @param taken - Slugs déjà attribués ; NON modifié par cette fonction.
 * @param hint - Qualificatif à essayer avant la numérotation.
 */
export function uniqueSlug(
  base: string,
  taken: ReadonlySet<string>,
  hint?: string,
): string {
  if (!taken.has(base)) return base;

  if (hint) {
    const qualified = `${base}-${slugify(hint)}`;
    if (!taken.has(qualified)) return qualified;
  }

  // Borné : au-delà, c'est que l'appelant boucle sur des données aberrantes
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }

  throw new Error(`Impossible de rendre le slug « ${base} » unique`);
}
