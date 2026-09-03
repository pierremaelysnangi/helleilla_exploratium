import "server-only";

/**
 * Résolution de la langue côté serveur.
 *
 * Deux sources, dans cet ordre :
 *
 * 1. le cookie `locale`, posé quand le visiteur choisit explicitement
 *    une langue. Un choix explicite prime toujours ;
 * 2. l'en-tête `Accept-Language` du navigateur, qui reflète les
 *    préférences réglées par la personne elle-même.
 *
 * Le PAYS n'entre pas dans la décision. Déduire la langue de la
 * géolocalisation se trompe systématiquement sur les pays plurilingues
 * et sur les voyageurs ; le navigateur, lui, transporte la réponse.
 */

import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  negotiateLocale,
  type Locale,
} from "./locales";
import { getDictionary, type Dictionary } from "./dictionaries";

/** Nom du cookie portant le choix explicite du visiteur. */
export const LOCALE_COOKIE = "locale";

/** Durée de conservation du choix : un an. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Langue à servir pour la requête en cours. */
export async function resolveLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (chosen && isLocale(chosen)) return chosen;

  const header = (await headers()).get("accept-language");
  return negotiateLocale(header) ?? DEFAULT_LOCALE;
}

/** Langue et dictionnaire de la requête en cours. */
export async function getTranslations(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await resolveLocale();
  return { locale, t: getDictionary(locale) };
}
