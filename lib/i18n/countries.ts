/**
 * Nom d'un pays dans la langue du visiteur.
 *
 * `Intl.DisplayNames` fait ce travail depuis le navigateur et depuis
 * Node : les noms de pays y sont ceux du référentiel CLDR d'Unicode,
 * maintenu et traduit par des locuteurs. Les recopier à la main dans
 * quinze langues serait à la fois inutile et moins fiable.
 */

import type { Locale } from "./locales";

/**
 * Nom d'un pays d'après son code ISO 3166-1 alpha-2.
 *
 * @param code - Code à deux lettres, tel que stocké en base.
 * @param locale - Langue d'affichage.
 * @returns Le nom traduit, ou le code lui-même si la plateforme ne sait
 *   pas le traduire — mieux vaut « ZZ » qu'une section sans titre.
 */
export function countryName(code: string, locale: Locale): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
