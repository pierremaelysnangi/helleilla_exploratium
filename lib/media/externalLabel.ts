/**
 * Libellés des liens sortants.
 *
 * Une flèche signale qu'un lien quitte le site. Elle était recopiée à
 * six endroits, chaque fois collée au libellé dans le JSX : le
 * détecteur de textes non traduits y voyait alors une chaîne figée, et
 * changer de symbole demandait six modifications.
 */

/** Marque d'un lien sortant, commune à toutes les langues. */
const OUTBOUND_MARK = "↗";

/**
 * Suffixe un libellé déjà traduit de la marque de lien sortant.
 *
 * @param label - Libellé traduit, ou nom propre d'une plateforme.
 */
export function externalLabel(label: string): string {
  return `${label} ${OUTBOUND_MARK}`;
}
