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
import { useT } from "@/lib/i18n/client";

/** Libellés français des types de preuve, ordre = du plus probant au moins. */
const KIND_LABELS: Record<EvidenceKind, string> = {
  musicbrainz: "MusicBrainz",
  discogs: "Discogs",
  label: "Label / maison de disques",
  "official-site": "Site officiel du groupe",
  press: "Article de presse",
  other: "Autre source",
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
  const { items, enough, official } = evidenceDiagnostics(value);

  /** Remplace une ligne à l'index donné. */
  function update(index: number, patch: Partial<EvidenceDraft>) {
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="metal-title text-base">Preuves</legend>

      <p className="text-muted-foreground text-sm">
        Deux preuves minimum, dont au moins une source officielle. C&apos;est ce
        qui garantit qu&apos;une fiche renvoie à un groupe réel et vérifiable.
      </p>

      <ul className="flex flex-col gap-3">
        {value.map((draft, index) => (
          <li key={index} className="metal-card flex flex-col gap-2 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sm:w-56">
                <span className="text-muted-foreground mb-1 block text-xs">
                  Type de source
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
                      {KIND_LABELS[kind]}
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
                  placeholder="https://musicbrainz.org/artist/…"
                  value={draft.url}
                  maxLength={500}
                  onChange={(e) => update(index, { url: e.target.value })}
                  className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>

            <label>
              <span className="text-muted-foreground mb-1 block text-xs">
                Note (facultatif)
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
          {enough ? "✓" : "•"} {items.length} preuve
          {items.length > 1 ? "s" : ""} renseignée
          {items.length > 1 ? "s" : ""} sur {MIN_EVIDENCE_COUNT} minimum
        </li>
        <li className={official ? "text-muted-foreground" : "text-destructive"}>
          {official ? "✓" : "•"} source officielle
          {official
            ? " fournie"
            : " manquante (MusicBrainz, Discogs, label ou site officiel)"}
        </li>
      </ul>
    </fieldset>
  );
}
