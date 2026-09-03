/**
 * Contenu encyclopédique traduit.
 *
 * Les textes d'INTERFACE vivent dans les dictionnaires : ils sont écrits
 * une fois pour toutes et le typage exige les quinze langues. Le contenu
 * ENCYCLOPÉDIQUE — biographies, présentations de lieux — ne fonctionne
 * pas ainsi : il est apporté par des contributeurs, dans une langue, et
 * une traduction n'existera que si quelqu'un l'écrit.
 *
 * D'où ce module minuscule mais nécessaire : servir la traduction quand
 * elle existe, le texte d'origine sinon. Jamais de blanc — une fiche
 * amputée de sa biographie serait pire qu'une biographie non traduite.
 */

import type { Locale } from "./locales";

/**
 * Texte à afficher pour la langue demandée.
 *
 * @param original - Texte d'origine, tel que saisi.
 * @param translations - Traductions disponibles, par code de langue.
 * @param locale - Langue du visiteur.
 * @returns La traduction si elle existe et n'est pas vide, sinon le
 *   texte d'origine — et `null` s'il n'y a rien du tout.
 */
export function localizedText(
  original: string | null | undefined,
  translations: Record<string, string> | null | undefined,
  locale: Locale,
): string | null {
  const translated = translations?.[locale]?.trim();
  if (translated) return translated;
  return original?.trim() || null;
}
