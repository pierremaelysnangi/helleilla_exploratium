/**
 * Phrases d'interface contenant un élément React.
 *
 * Une phrase traversée par un lien — « Connectez-vous pour noter cet
 * album » — était jusqu'ici écrite en trois morceaux autour du `<Link>`.
 * Ce découpage fige l'ordre des mots du français : l'allemand rejette le
 * verbe à la fin, le japonais place le complément avant, et l'arabe lit
 * de droite à gauche. Aucune de ces langues ne peut se traduire à
 * l'intérieur de morceaux dont l'ordre lui échappe.
 *
 * La phrase entière vit donc dans le dictionnaire, avec un marqueur
 * `{lien}` que chaque langue place où sa syntaxe l'exige.
 */

import { Fragment, type ReactNode } from "react";

/**
 * Remplace les marqueurs `{clé}` par des éléments React.
 *
 * Un marqueur sans valeur est laissé visible, comme dans
 * `interpolate` : un oubli doit se voir plutôt que produire un blanc.
 *
 * @param template - Texte du dictionnaire.
 * @param values - Nœuds à insérer, par nom de marqueur.
 */
export function rich(
  template: string,
  values: Record<string, ReactNode>,
): ReactNode {
  const parts = template.split(/(\{\w+\})/g);
  return parts.map((part, index) => {
    const marker = /^\{(\w+)\}$/.exec(part);
    const value = marker ? values[marker[1]] : undefined;
    return (
      <Fragment key={index}>{value === undefined ? part : value}</Fragment>
    );
  });
}
