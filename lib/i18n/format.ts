/**
 * Interpolation des textes d'interface.
 *
 * Les dictionnaires portent des marqueurs `{nom}` plutôt que des textes
 * découpés en morceaux à recoller. Une phrase coupée en trois impose son
 * ordre français à toutes les langues, ce qui est faux dès l'allemand —
 * et impossible en japonais.
 */

/**
 * Remplace les marqueurs `{clé}` par leurs valeurs.
 *
 * Un marqueur sans valeur est laissé tel quel : mieux vaut afficher
 * `{band}` et voir l'oubli que d'afficher un blanc silencieux.
 *
 * @param template - Texte du dictionnaire.
 * @param values - Valeurs à insérer.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
