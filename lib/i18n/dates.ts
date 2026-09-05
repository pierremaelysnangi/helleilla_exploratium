/**
 * Mise en forme des dates.
 *
 * Deux composants formataient leurs dates en « fr-FR » écrit en dur :
 * un lecteur japonais lisait donc « 04 septembre 2026 » sur une page
 * par ailleurs traduite. Le format d'une date fait partie de la langue,
 * au même titre que les mots — l'ordre des éléments, le séparateur et le
 * nom des mois en dépendent tous.
 */

import type { Locale } from "./locales";

/**
 * Formateurs mémorisés : en construire un coûte, et une liste d'avis
 * en demande autant qu'elle compte de lignes.
 */
const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function formatterFor(
  locale: Locale,
  key: string,
  options: Intl.DateTimeFormatOptions,
) {
  const cacheKey = `${locale}:${key}`;
  const cached = FORMATTERS.get(cacheKey);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat(locale, options);
  FORMATTERS.set(cacheKey, created);
  return created;
}

/**
 * Date longue : « 4 septembre 2026 », « September 4, 2026 », « 2026年9月4日 ».
 *
 * @param locale - Langue de rendu.
 * @param iso - Date ISO, ou rien.
 * @param fallback - Texte rendu en l'absence de date.
 */
export function formatLongDate(
  locale: Locale,
  iso?: string | null,
  fallback = "—",
): string {
  if (!iso) return fallback;
  return formatterFor(locale, "long", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/** Date courte, pour les tableaux où la place manque. */
export function formatShortDate(
  locale: Locale,
  iso?: string | null,
  fallback = "—",
): string {
  if (!iso) return fallback;
  return formatterFor(locale, "short", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
