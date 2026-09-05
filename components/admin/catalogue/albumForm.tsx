"use client";

/**
 * <AlbumForm> — création et modification d'une sortie.
 *
 * Le TYPE est un vrai choix éditorial, pas une formalité : c'est lui qui
 * range une œuvre parmi les albums studio, les démos ou les splits, et
 * une erreur ici fausse la discographie entière du groupe. Il est donc
 * demandé explicitement, sans valeur devinée depuis le titre.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateAlbum, useUpdateAlbum } from "@/hooks/use-albums";
import { useT } from "@/lib/i18n/client";
import {
  FormField,
  FormSelect,
  SubmitButton,
  FormError,
} from "@/components/shared/formField";
import type { AlbumRow } from "@/hooks/api/schemas";

/** Types de sortie, dans l'ordre de la discographie affichée. */
const TYPES = [
  "album",
  "ep",
  "single",
  "compilation",
  "live",
  "demo",
  "split",
] as const;

type Draft = {
  title: string;
  slug: string;
  type: (typeof TYPES)[number];
  releaseYear: string;
  releaseDate: string;
  coverUrl: string;
};

function toDraft(album?: AlbumRow): Draft {
  return {
    title: album?.title ?? "",
    slug: album?.slug ?? "",
    type: (album?.type as Draft["type"]) ?? "album",
    releaseYear: album?.releaseYear?.toString() ?? "",
    releaseDate: album?.releaseDate ?? "",
    coverUrl: album?.coverUrl ?? "",
  };
}

function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AlbumForm({
  bandId,
  album,
}: {
  /** Groupe qui signe la sortie ; fixé, jamais choisi ici. */
  bandId: string;
  album?: AlbumRow;
}) {
  const t = useT();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(album));
  const [slugTouched, setSlugTouched] = useState(Boolean(album));

  const create = useCreateAlbum();
  const update = useUpdateAlbum();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  const effectiveSlug = slugTouched ? draft.slug : slugify(draft.title);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          bandId,
          title: draft.title.trim(),
          slug: effectiveSlug,
          type: draft.type,
          releaseYear: draft.releaseYear ? Number(draft.releaseYear) : null,
          releaseDate: draft.releaseDate || null,
          coverUrl: draft.coverUrl.trim() || null,
        };
        if (album) {
          update.mutate({ id: album.id, ...payload });
        } else {
          create.mutate(payload, {
            onSuccess: (created) =>
              router.push(`/admin/catalogue/albums/${created.id}`),
          });
        }
      }}
    >
      <FormField
        id="title"
        label={t.admin.albumTitle}
        required
        maxLength={200}
        value={draft.title}
        onChange={(e) => set("title", e.target.value)}
      />

      <FormField
        id="slug"
        label={t.contributions.urlIdentifier}
        required
        maxLength={200}
        hint={t.admin.albumSlugHint}
        value={effectiveSlug}
        onChange={(e) => {
          setSlugTouched(true);
          set("slug", e.target.value);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormSelect
          id="type"
          label={t.admin.releaseTypeLabel}
          value={draft.type}
          onChange={(e) => set("type", e.target.value as Draft["type"])}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {t.releaseType[type]}
            </option>
          ))}
        </FormSelect>

        <FormField
          id="releaseYear"
          label={t.catalogue.year}
          type="number"
          min={1900}
          max={new Date().getFullYear() + 1}
          value={draft.releaseYear}
          onChange={(e) => set("releaseYear", e.target.value)}
        />

        <FormField
          id="releaseDate"
          label={t.admin.releaseDate}
          type="date"
          value={draft.releaseDate}
          onChange={(e) => set("releaseDate", e.target.value)}
        />
      </div>

      <FormField
        id="coverUrl"
        label={t.admin.coverUrl}
        type="url"
        inputMode="url"
        hint={t.admin.coverUrlHint}
        value={draft.coverUrl}
        onChange={(e) => set("coverUrl", e.target.value)}
      />

      {error && <FormError>{error.message}</FormError>}
      {update.isSuccess && (
        <p role="status" className="text-muted-foreground text-sm">
          {t.admin.saved}
        </p>
      )}

      <SubmitButton pending={pending} disabled={!draft.title.trim()}>
        {pending ? t.app.saving : t.app.save}
      </SubmitButton>
    </form>
  );
}
