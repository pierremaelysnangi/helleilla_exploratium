/**
 * Mise en forme des durées.
 *
 * Rassemblé ici parce que trois vues affichent des durées — la ligne
 * d'une piste, l'en-tête d'un album et sa tracklist — et que chacune
 * avait sa propre fonction. Des règles divergentes sur l'arrondi ou sur
 * l'absence de donnée y auraient produit des totaux qui ne
 * correspondent pas aux lignes qu'ils résument.
 */

/** Durée d'une piste, en `m:ss`. Tiret cadratin si elle est inconnue. */
export function formatTrackDuration(ms?: number | null): string {
  if (ms == null) return "—";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Durée cumulée d'un album, et si elle est incomplète. */
export type TotalDuration = {
  /** « 47 min », « 1 h 12 min ». */
  label: string;
  /**
   * Vrai si des pistes ne sont pas minutées.
   *
   * Le total est alors un MINIMUM. L'annoncer sec laisserait croire à un
   * album plus court : MusicBrainz ne renseigne pas les longueurs de
   * certaines rééditions ni de beaucoup d'enregistrements de répétition.
   */
  partial: boolean;
};

/**
 * Durée totale d'une liste de pistes.
 *
 * @returns `null` si AUCUNE piste n'est minutée — il n'y a alors rien à
 *   dire, et afficher « 0 min » serait faux.
 */
export function formatTotalDuration(
  tracks: readonly { durationMs?: number | null }[],
): TotalDuration | null {
  const timed = tracks.filter((t) => t.durationMs != null);
  if (timed.length === 0) return null;

  const minutes = Math.round(
    timed.reduce((sum, t) => sum + (t.durationMs ?? 0), 0) / 60000,
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  const label =
    minutes < 60
      ? `${minutes} min`
      : rest === 0
        ? `${hours} h`
        : `${hours} h ${String(rest).padStart(2, "0")} min`;

  return { label, partial: timed.length < tracks.length };
}

/**
 * Durée totale au format ISO 8601, pour les données structurées
 * schema.org (`MusicAlbum.duration`).
 */
export function totalDurationIso(
  tracks: readonly { durationMs?: number | null }[],
): string | null {
  const total = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  if (total === 0) return null;
  return `PT${Math.floor(total / 60000)}M${Math.round((total % 60000) / 1000)}S`;
}

/**
 * Durée saisie « m:ss » -> millisecondes.
 *
 * Inverse exact de `formatTrackDuration`, et volontairement STRICT :
 * une saisie approximative renvoie `null` plutôt qu'une valeur devinée.
 * « 4:5 » pourrait vouloir dire 4 min 5 s ou 4 min 50 s — on ne tranche
 * pas à la place de la personne, on lui signale la faute.
 *
 * @param input - Texte saisi ; vide signifie « durée inconnue ».
 * @returns Les millisecondes, ou `null` si la saisie est vide ou mal
 *   formée. L'appelant distingue les deux par la vacuité du texte.
 */
export function parseTrackDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = /^(\d+):([0-5]\d)$/.exec(trimmed);
  if (!match) return null;
  return (Number(match[1]) * 60 + Number(match[2])) * 1000;
}
