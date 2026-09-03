"use client";

/**
 * <EvidenceFields> — éditeur de preuves d'une contribution.
 *
 * C'est l'endroit où la règle du projet se joue côté interface : le
 * contributeur doit fournir au moins deux preuves DONT une officielle.
 * Le composant rend cette exigence lisible en continu plutôt que de la
 * révéler après un envoi refusé — chaque soumission consomme l'un des
 * cinq envois horaires autorisés.
 *
 * Composant contrôlé : l'état des preuves appartient au formulaire parent.
 */

import {
  OFFICIAL_EVIDENCE_KINDS,
  MIN_EVIDENCE_COUNT,
  hasOfficialEvidence,
  type EvidenceItem,
  type EvidenceKind,
} from "@/lib/validations/contribution";
import { useT, usePlural } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Libellés français des types de preuve, ordre = du plus probant au moins. */
/** Exemple d'adresse attendue : une URL, identique dans toutes les langues. */
const EVIDENCE_URL_EXAMPLE = "https://musicbrainz.org/artist/…";

const KIND_LABELS: Record<EvidenceKind, (t: Dictionary) => string> = {
  // Deux noms propres : les bases de données s'appellent ainsi partout.
  musicbrainz: () => "MusicBrainz",
  discogs: () => "Discogs",
  label: (t) => t.evidenceKind.label,
  "official-site": (t) => t.evidenceKind.officialSite,
  press: (t) => t.evidenceKind.press,
  other: (t) => t.evidenceKind.other,
};

/** Ordre d'affichage : les sources officielles en tête. */
const KIND_ORDER: EvidenceKind[] = [
  ...OFFICIAL_EVIDENCE_KINDS,
  "press",
  "other",
];

/** Preuve en cours de saisie : l'URL peut être vide tant qu'on édite. */
export type EvidenceDraft = {
  kind: EvidenceKind;
  url: string;
  note: string;
};

/** Crée une ligne de preuve vierge. */
export function emptyEvidence(): EvidenceDraft {
  return { kind: "musicbrainz", url: "", note: "" };
}

/**
 * Convertit les brouillons en preuves exploitables par l'API : les lignes
 * sans URL sont ignorées, les notes vides omises.
 */
export function toEvidenceItems(drafts: EvidenceDraft[]): EvidenceItem[] {
  return drafts
    .filter((d) => d.url.trim().length > 0)
    .map((d) => ({
      kind: d.kind,
      url: d.url.trim(),
      ...(d.note.trim() ? { note: d.note.trim() } : {}),
    }));
}

/** Diagnostic de conformité, partagé avec le bouton de soumission. */
export function evidenceDiagnostics(drafts: EvidenceDraft[]) {
  const items = toEvidenceItems(drafts);
  const enough = items.length >= MIN_EVIDENCE_COUNT;
  const official = hasOfficialEvidence(items.map((i) => i.kind));
  return { items, enough, official, valid: enough && official };
}

type EvidenceFieldsProps = {
  value: EvidenceDraft[];
  onChange: (next: EvidenceDraft[]) => void;
  /** Désactive l'édition pendant l'envoi. */
  disabled?: boolean;
};

export function EvidenceFields({
  value,
  onChange,
  disabled = false,
}: EvidenceFieldsProps) {
  const t = useT();
  const n = usePlural();
  const { items, enough, official } = evidenceDiagnostics(value);

  /** Remplace une ligne à l'index donné. */
  function update(index: number, patch: Partial<EvidenceDraft>) {
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="metal-title text-base">
        {t.contributions.evidence}
      </legend>

      <p className="text-muted-foreground text-sm">
        {t.contributions.evidenceRule}
      </p>

      <ul className="flex flex-col gap-3">
        {value.map((draft, index) => (
          <li key={index} className="metal-card flex flex-col gap-2 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sm:w-56">
                <span className="text-muted-foreground mb-1 block text-xs">
                  {t.contributions.sourceKind}
                </span>
                <select
                  value={draft.kind}
                  onChange={(e) =>
                    update(index, { kind: e.target.value as EvidenceKind })
                  }
                  className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
                >
                  {KIND_ORDER.map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND_LABELS[kind](t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 flex-1">
                <span className="text-muted-foreground mb-1 block text-xs">
                  {t.contributions.verifiableLink}
                </span>
                <input
                  type="url"
                  inputMode="url"
                  placeholder={EVIDENCE_URL_EXAMPLE}
                  value={draft.url}
                  maxLength={500}
                  onChange={(e) => update(index, { url: e.target.value })}
                  className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>

            <label>
              <span className="text-muted-foreground mb-1 block text-xs">
                {t.contributions.optionalNote}
              </span>
              <input
                type="text"
                placeholder={t.contributions.evidenceNote}
                value={draft.note}
                maxLength={500}
                onChange={(e) => update(index, { note: e.target.value })}
                className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
              />
            </label>

            {value.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="text-muted-foreground hover:text-destructive self-start text-xs underline"
              >
                {t.contributions.removeEvidence}
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...value, emptyEvidence()])}
        className="border-border hover:bg-accent/30 self-start rounded-md border px-3 py-1.5 text-xs font-medium tracking-wide uppercase"
      >
        {t.contributions.addEvidence}
      </button>

      {/* État courant de la règle, annoncé aux lecteurs d'écran */}
      <ul aria-live="polite" className="flex flex-col gap-1 text-xs">
        <li className={enough ? "text-muted-foreground" : "text-destructive"}>
          {`${enough ? "✓" : "•"} ${interpolate(
            t.contributions.evidenceProgress,
            {
              provided: n(t.count.evidence, items.length),
              min: MIN_EVIDENCE_COUNT,
            },
          )}`}
        </li>
        <li className={official ? "text-muted-foreground" : "text-destructive"}>
          {`${official ? "✓" : "•"} ${
            official
              ? t.contributions.officialSourceProvided
              : t.contributions.officialSourceMissing
          }`}
        </li>
      </ul>
    </fieldset>
  );
}
