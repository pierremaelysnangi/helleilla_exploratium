"use client";

/**
 * <ContributionForm> — soumission d'un nouveau groupe.
 *
 * Le formulaire est verrouillé tant que la règle du projet n'est pas
 * satisfaite (deux preuves dont une officielle) : la soumission est
 * limitée à cinq envois par heure, il serait hostile de laisser partir
 * un dossier qu'on sait irrecevable.
 */

import { useState } from "react";
import Link from "next/link";
// Mutation de soumission
import { useCreateContribution } from "@/hooks/use-contributions";
// Éditeur de preuves + utilitaires de conformité
import {
  EvidenceFields,
  emptyEvidence,
  evidenceDiagnostics,
  type EvidenceDraft,
} from "./evidenceFields";

/** Champs du groupe soumis, tous optionnels sauf nom et slug. */
type BandDraft = {
  name: string;
  slug: string;
  bio: string;
  countryCode: string;
  formedYear: string;
  dissolvedYear: string;
};

const EMPTY_BAND: BandDraft = {
  name: "",
  slug: "",
  bio: "",
  countryCode: "",
  formedYear: "",
  dissolvedYear: "",
};

/** Dérive un slug kebab-case depuis le nom saisi. */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Convertit une saisie d'année en nombre, ou undefined si vide. */
function yearOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

export function ContributionForm() {
  const [band, setBand] = useState<BandDraft>(EMPTY_BAND);
  // Le slug suit le nom tant que l'utilisateur ne l'a pas édité lui-même
  const [slugTouched, setSlugTouched] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceDraft[]>([
    emptyEvidence(),
    { ...emptyEvidence(), kind: "official-site" },
  ]);

  const create = useCreateContribution();
  const { items, valid: evidenceValid } = evidenceDiagnostics(evidence);

  const effectiveSlug = slugTouched ? band.slug : slugify(band.name);
  const canSubmit =
    band.name.trim().length > 0 &&
    effectiveSlug.length > 0 &&
    evidenceValid &&
    !create.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    create.mutate({
      type: "band_create",
      payload: {
        name: band.name.trim(),
        slug: effectiveSlug,
        bio: band.bio.trim() || undefined,
        countryCode: band.countryCode.trim().toUpperCase() || undefined,
        formedYear: yearOrUndefined(band.formedYear),
        dissolvedYear: yearOrUndefined(band.dissolvedYear),
      },
      evidence: items,
    });
  }

  // --- Confirmation : le dossier part en relecture, il n'est pas publié ---
  if (create.isSuccess) {
    return (
      <div className="metal-card flex flex-col items-start gap-3 p-6">
        <h2 className="metal-title text-lg">Dossier transmis</h2>
        <p className="text-sm">
          Votre contribution part en relecture. Un modérateur la validera ou
          vous demandera des preuves complémentaires — vous suivrez son
          avancement depuis vos dossiers.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/contributions/mes-dossiers"
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:opacity-90"
          >
            Voir mes dossiers
          </Link>
          <button
            type="button"
            onClick={() => {
              setBand(EMPTY_BAND);
              setSlugTouched(false);
              setEvidence([
                emptyEvidence(),
                { ...emptyEvidence(), kind: "official-site" },
              ]);
              create.reset();
            }}
            className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-sm font-semibold tracking-wide uppercase"
          >
            Proposer un autre groupe
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3" disabled={create.isPending}>
        <legend className="metal-title text-base">Le groupe</legend>

        <label>
          <span className="text-muted-foreground mb-1 block text-xs">
            Nom <span aria-hidden>*</span>
          </span>
          <input
            required
            maxLength={200}
            value={band.name}
            onChange={(e) => setBand({ ...band, name: e.target.value })}
            className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
          />
        </label>

        <label>
          <span className="text-muted-foreground mb-1 block text-xs">
            Identifiant d&apos;URL <span aria-hidden>*</span>
          </span>
          <input
            required
            maxLength={200}
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setBand({ ...band, slug: e.target.value });
            }}
            className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 font-mono text-sm outline-none"
          />
          <span className="text-muted-foreground mt-1 block text-xs">
            Dérivé du nom ; en minuscules et tirets.
          </span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sm:w-32">
            <span className="text-muted-foreground mb-1 block text-xs">
              Pays (ISO)
            </span>
            <input
              maxLength={2}
              placeholder="NO"
              value={band.countryCode}
              onChange={(e) =>
                setBand({ ...band, countryCode: e.target.value.toUpperCase() })
              }
              className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 font-mono text-sm outline-none"
            />
          </label>
          <label className="sm:w-40">
            <span className="text-muted-foreground mb-1 block text-xs">
              Année de formation
            </span>
            <input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={band.formedYear}
              onChange={(e) => setBand({ ...band, formedYear: e.target.value })}
              className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="sm:w-40">
            <span className="text-muted-foreground mb-1 block text-xs">
              Année de séparation
            </span>
            <input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={band.dissolvedYear}
              onChange={(e) =>
                setBand({ ...band, dissolvedYear: e.target.value })
              }
              className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        <label>
          <span className="text-muted-foreground mb-1 block text-xs">
            Biographie
          </span>
          <textarea
            rows={5}
            maxLength={5000}
            value={band.bio}
            onChange={(e) => setBand({ ...band, bio: e.target.value })}
            className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
          />
        </label>
      </fieldset>

      <EvidenceFields
        value={evidence}
        onChange={setEvidence}
        disabled={create.isPending}
      />

      {create.isError && (
        <p role="alert" className="text-destructive text-sm">
          {create.error.message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-primary text-primary-foreground self-start rounded-md px-5 py-2 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? "Envoi…" : "Soumettre le dossier"}
        </button>
        {!evidenceValid && (
          <p className="text-muted-foreground text-xs">
            Complétez les preuves pour pouvoir soumettre.
          </p>
        )}
      </div>
    </form>
  );
}
