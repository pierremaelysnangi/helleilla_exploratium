/**
 * Accords en nombre.
 *
 * Le français distingue deux formes, le japonais aucune, le russe
 * quatre et l'arabe six. Écrire `{n} groupe{n > 1 ? "s" : ""}` impose
 * donc la grammaire française à quinze langues : « 2 группа » au lieu
 * de « 2 группы », et un pluriel là où le japonais n'en veut pas.
 *
 * `Intl.PluralRules` porte les règles du CLDR pour chaque langue ; le
 * dictionnaire n'a plus qu'à fournir les formes que sa langue utilise
 * réellement.
 */

import { interpolate } from "./format";
import type { Locale } from "./locales";

/**
 * Les formes d'un texte compté.
 *
 * `other` est la seule obligatoire : c'est le repli quand la langue
 * n'emploie pas la catégorie sélectionnée, et la seule forme dont le
 * japonais ou le chinois aient besoin.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/**
 * Sélecteurs mémorisés : construire un `Intl.PluralRules` coûte, et une
 * liste de cent groupes appelle cette fonction cent fois.
 */
const SELECTORS = new Map<string, Intl.PluralRules>();

function selectorFor(locale: Locale): Intl.PluralRules {
  const cached = SELECTORS.get(locale);
  if (cached) return cached;
  const created = new Intl.PluralRules(locale);
  SELECTORS.set(locale, created);
  return created;
}

/**
 * Rend un texte compté dans la forme qu'impose la langue.
 *
 * Le nombre est inséré sous `{n}`, formaté selon la langue : l'arabe
 * s'écrit avec ses propres chiffres, l'allemand sépare les milliers par
 * un point.
 *
 * @param locale - Langue de rendu.
 * @param forms - Formes déclarées par le dictionnaire.
 * @param count - Quantité à accorder.
 * @param values - Marqueurs supplémentaires éventuels.
 */
export function plural(
  locale: Locale,
  forms: PluralForms,
  count: number,
  values: Record<string, string | number> = {},
): string {
  const category = selectorFor(locale).select(count);
  const template = forms[category] ?? forms.other;
  return interpolate(template, { n: count.toLocaleString(locale), ...values });
}
