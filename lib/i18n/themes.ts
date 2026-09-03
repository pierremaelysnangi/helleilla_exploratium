/**
 * Traduction des thèmes de textes.
 *
 * Les thèmes ne sont pas de la prose libre : c'est un vocabulaire fermé,
 * une vingtaine d'entrées qui reviennent d'une fiche à l'autre
 * (« Satanisme », « Mythologie nordique », « Mélancolie »). À ce titre
 * ils se traduisent, là où une biographie ne le peut pas.
 *
 * Un thème inconnu du répertoire est rendu tel quel : une contribution
 * peut en introduire un nouveau, et l'afficher en français vaut mieux
 * que de l'escamoter.
 *
 * Les noms de GENRES, eux, restent intraduits partout : « Black Metal »
 * est un nom propre de la scène.
 */

import type { Dictionary } from "./dictionaries";

/** Forme de comparaison : casse et accents ne distinguent pas un thème. */
function normalize(theme: string): string {
  return theme.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Thème tel qu'il est saisi (en français) -> clé du dictionnaire. */
const THEME_KEYS: Record<string, keyof Dictionary["theme"]> = {
  alienation: "alienation",
  "amour perdu": "lostLove",
  art: "art",
  chaos: "chaos",
  "contre-culture": "counterculture",
  decadence: "decadence",
  desespoir: "despair",
  deuil: "mourning",
  existentialisme: "existentialism",
  hiver: "winter",
  introspection: "introspection",
  melancolie: "melancholy",
  misanthropie: "misanthropy",
  mort: "death",
  mythologie: "mythology",
  "mythologie nordique": "norseMythology",
  nature: "nature",
  occultisme: "occultism",
  perte: "loss",
  philosophie: "philosophy",
  religion: "religion",
  satanisme: "satanism",
};

/** Libellé traduit d'un thème, ou le thème d'origine s'il est inconnu. */
export function translateTheme(t: Dictionary, theme: string): string {
  const key = THEME_KEYS[normalize(theme)];
  return key ? t.theme[key] : theme;
}
