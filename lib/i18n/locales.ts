/**
 * Langues proposées par l'interface.
 *
 * Le choix couvre la scène metal et les langues les plus parlées. Chaque
 * entrée porte son nom DANS SA PROPRE LANGUE (endonyme) : un lecteur qui
 * cherche sa langue dans une liste ne la reconnaît pas sous un exonyme
 * français.
 *
 * `dir` prépare l'arabe, écrit de droite à gauche : la valeur est posée
 * sur `<html>` et retourne la mise en page entière.
 *
 * Ces traductions sont rédigées à la main, en appliquant la grammaire et
 * l'orthographe de chaque langue — accords, genre des noms, ordre des
 * mots, registre. Elles ne sortent d'aucun service de traduction
 * automatique. Une relecture par une personne dont c'est la langue reste
 * souhaitable, en particulier pour les langues les plus éloignées du
 * français.
 */

export const LOCALES = [
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "it", label: "Italiano", dir: "ltr" },
  { code: "nl", label: "Nederlands", dir: "ltr" },
  { code: "sv", label: "Svenska", dir: "ltr" },
  { code: "nb", label: "Norsk bokmål", dir: "ltr" },
  { code: "fi", label: "Suomi", dir: "ltr" },
  { code: "pl", label: "Polski", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
] as const satisfies readonly {
  code: string;
  label: string;
  dir: "ltr" | "rtl";
}[];

export type Locale = (typeof LOCALES)[number]["code"];

/** Langue servie par défaut, et repli de toute clé non traduite. */
export const DEFAULT_LOCALE: Locale = "fr";

/** Codes acceptés, pour valider un cookie ou un en-tête. */
const CODES = new Set<string>(LOCALES.map((l) => l.code));

/** Vrai si la chaîne désigne une langue proposée. */
export function isLocale(value: string): value is Locale {
  return CODES.has(value);
}

/** Sens d'écriture d'une langue. */
export function localeDir(locale: Locale): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
}

/**
 * Choisit une langue à partir de l'en-tête `Accept-Language`.
 *
 * L'en-tête liste les préférences du visiteur avec un poids (`q`), du
 * plus au moins souhaité : « fr-CA,fr;q=0.9,en;q=0.8 ». On le respecte
 * plutôt que de déduire la langue du pays — un visiteur en Belgique peut
 * lire le néerlandais ou le français, et son navigateur le sait, pas
 * nous.
 *
 * Les variantes régionales sont ramenées à leur langue : `pt-BR` et
 * `pt-PT` partagent nos textes, `zh-Hans` comme `zh-TW` retombent sur
 * `zh`. Le norvégien `no` est traité comme `nb`, forme écrite majoritaire.
 *
 * @param header - Valeur brute de `Accept-Language`, ou null.
 * @returns La langue retenue ; `DEFAULT_LOCALE` si aucune ne correspond.
 */
export function negotiateLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const normalized = base === "no" ? "nb" : base;
    if (isLocale(normalized)) return normalized;
  }

  return DEFAULT_LOCALE;
}
