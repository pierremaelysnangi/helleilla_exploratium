/**
 * Registre des dictionnaires.
 *
 * Chaque langue est importée statiquement : le catalogue tient dans
 * quelques kilo-octets, et un import dynamique introduirait une attente
 * au premier rendu pour un gain négligeable.
 *
 * Le type garantit deux choses à la compilation : aucune langue déclarée
 * dans `LOCALES` ne peut manquer ici, et aucun dictionnaire ne peut
 * omettre une clé du français.
 */

import { DEFAULT_LOCALE, type Locale } from "./locales";
import { fr, type Dictionary } from "./locales/fr";
import { en } from "./locales/en";
import { de } from "./locales/de";
import { es } from "./locales/es";
import { pt } from "./locales/pt";
import { it } from "./locales/it";
import { nl } from "./locales/nl";
import { sv } from "./locales/sv";
import { nb } from "./locales/nb";
import { fi } from "./locales/fi";
import { pl } from "./locales/pl";
import { ru } from "./locales/ru";
import { ja } from "./locales/ja";
import { zh } from "./locales/zh";
import { ar } from "./locales/ar";

const DICTIONARIES: Record<Locale, Dictionary> = {
  fr,
  en,
  de,
  es,
  pt,
  it,
  nl,
  sv,
  nb,
  fi,
  pl,
  ru,
  ja,
  zh,
  ar,
};

/** Dictionnaire d'une langue ; le français sert de dernier recours. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export type { Dictionary };
