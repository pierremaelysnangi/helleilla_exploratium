"use client";

/**
 * <BandForm> — création et modification d'un groupe.
 *
 * Un seul composant pour les deux : les champs, leurs bornes et leurs
 * messages sont identiques, et deux formulaires jumeaux auraient dérivé
 * à la première évolution du schéma. Ce qui change tient en une
 * condition — l'appel de mutation et le libellé du bouton.
 *
 * La validation vient de `createBandSchema` / `updateBandBodySchema`,
 * les mêmes schémas que ceux appliqués par la route. Le formulaire ne
 * redéfinit aucune règle : il ne fait que rendre celles qui existent.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateBand, useUpdateBand } from "@/hooks/use-bands";
import { useT } from "@/lib/i18n/client";
import {
  FormField,
  FormTextarea,
  SubmitButton,
  FormError,
} from "@/components/shared/formField";
import type { BandRow } from "@/hooks/api/schemas";

/** Champs édités, tous en texte : la conversion se fait à l'envoi. */
type Draft = {
  name: string;
  slug: string;
  countryCode: string;
  formedYear: string;
  dissolvedYear: string;
  bio: string;
  themes: string;
};

function toDraft(band?: BandRow): Draft {
  return {
    name: band?.name ?? "",
    slug: band?.slug ?? "",
    countryCode: band?.countryCode ?? "",
    formedYear: band?.formedYear?.toString() ?? "",
    dissolvedYear: band?.dissolvedYear?.toString() ?? "",
    bio: band?.bio ?? "",
    themes: (band?.themes ?? []).join(", "),
  };
}

/**
 * Dérive un slug d'un nom : minuscules, accents retirés, tirets.
 *
 * Proposé tant que le champ n'a pas été touché à la main. Un slug se
 * corrige, mais le saisir intégralement pour chaque groupe est une
 * corvée qui produit surtout des fautes de frappe.
 */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Corps envoyé à l'API : les champs vides deviennent `null`, pas `""`. */
function toPayload(draft: Draft) {
  const themes = draft.themes
    .split(",")
    .map((theme) => theme.trim())
    .filter(Boolean);

  return {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    countryCode: draft.countryCode.trim() || null,
    formedYear: draft.formedYear ? Number(draft.formedYear) : null,
    dissolvedYear: draft.dissolvedYear ? Number(draft.dissolvedYear) : null,
    bio: draft.bio.trim() || null,
    themes: themes.length > 0 ? themes : null,
  };
}

export function BandForm({ band }: { band?: BandRow }) {
  const t = useT();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(band));
  const [slugTouched, setSlugTouched] = useState(Boolean(band));

  const create = useCreateBand();
  const update = useUpdateBand();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  const effectiveSlug = slugTouched ? draft.slug : slugify(draft.name);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = toPayload({ ...draft, slug: effectiveSlug });
        if (band) {
          update.mutate({ id: band.id, ...payload });
        } else {
          create.mutate(payload, {
            // La création n'a nulle part où rester : on enchaîne sur
            // l'écran du groupe, où se saisissent genres et sorties.
            onSuccess: (created) =>
              router.push(`/admin/catalogue/groupes/${created.id}`),
          });
        }
      }}
    >
      <FormField
        id="name"
        label={t.contributions.name}
        required
        maxLength={200}
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
      />

      <FormField
        id="slug"
        label={t.contributions.urlIdentifier}
        required
        maxLength={200}
        hint={t.contributions.slugHint}
        value={effectiveSlug}
        onChange={(e) => {
          setSlugTouched(true);
          set("slug", e.target.value);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          id="countryCode"
          label={t.contributions.countryIso}
          maxLength={2}
          value={draft.countryCode}
          onChange={(e) => set("countryCode", e.target.value.toUpperCase())}
        />
        <FormField
          id="formedYear"
          label={t.contributions.formedYear}
          type="number"
          min={1900}
          max={new Date().getFullYear()}
          value={draft.formedYear}
          onChange={(e) => set("formedYear", e.target.value)}
        />
        <FormField
          id="dissolvedYear"
          label={t.contributions.dissolvedYear}
          type="number"
          min={1900}
          max={new Date().getFullYear()}
          value={draft.dissolvedYear}
          onChange={(e) => set("dissolvedYear", e.target.value)}
        />
      </div>

      <FormTextarea
        id="bio"
        label={t.contributions.biography}
        rows={5}
        maxLength={5000}
        value={draft.bio}
        onChange={(e) => set("bio", e.target.value)}
      />

      <FormField
        id="themes"
        label={t.band.themes}
        hint={t.admin.themesHint}
        value={draft.themes}
        onChange={(e) => set("themes", e.target.value)}
      />

      {error && <FormError>{error.message}</FormError>}

      {update.isSuccess && (
        <p role="status" className="text-muted-foreground text-sm">
          {t.admin.saved}
        </p>
      )}

      <SubmitButton pending={pending} disabled={!draft.name.trim()}>
        {pending ? t.app.saving : t.app.save}
      </SubmitButton>
    </form>
  );
}
