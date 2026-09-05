"use client";

/**
 * <TracklistEditor> — les pistes d'une sortie.
 *
 * Édition ligne à ligne plutôt qu'un formulaire par piste : une
 * tracklist se corrige d'un bloc — un numéro décalé, une durée
 * manquante — et ouvrir un écran par morceau pour changer trois
 * secondes serait absurde.
 *
 * Chaque ligne s'enregistre SÉPARÉMENT. Un envoi global aurait dû
 * décider quoi faire d'un échec au milieu : garder les huit premières
 * pistes et perdre les suivantes, ou tout annuler. Ligne à ligne,
 * l'échec est visible là où il se produit et n'emporte rien d'autre.
 */

import { useState } from "react";
import {
  useTracks,
  useCreateTrack,
  useUpdateTrack,
  useDeleteTrack,
} from "@/hooks/use-tracks";
import { useT } from "@/lib/i18n/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FIELD_CLASS, FormError } from "@/components/shared/formField";
import { formatTrackDuration, parseTrackDuration } from "@/lib/media/duration";
import type { TrackRow } from "@/hooks/api/schemas";

/** Millisecondes -> « m:ss », vide si la durée est inconnue. */
function toDurationInput(ms: number | null | undefined): string {
  return ms ? formatTrackDuration(ms) : "";
}

/** Une ligne de saisie : numéro, titre, durée. */
function TrackRowEditor({ track }: { track: TrackRow }) {
  const t = useT();
  const update = useUpdateTrack();
  const remove = useDeleteTrack();

  const [title, setTitle] = useState(track.title);
  const [number, setNumber] = useState(track.trackNumber?.toString() ?? "");
  const [duration, setDuration] = useState(toDurationInput(track.durationMs));

  const durationMs = parseTrackDuration(duration);
  const durationInvalid = duration.trim() !== "" && durationMs === null;

  const dirty =
    title !== track.title ||
    number !== (track.trackNumber?.toString() ?? "") ||
    duration !== toDurationInput(track.durationMs);

  return (
    <li className="border-border flex flex-wrap items-center gap-2 border-b py-2 last:border-b-0">
      <input
        type="number"
        min={1}
        aria-label={t.admin.trackNumber}
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className={`${FIELD_CLASS} w-16 shrink-0`}
      />
      <input
        aria-label={t.admin.trackTitle}
        value={title}
        maxLength={300}
        onChange={(e) => setTitle(e.target.value)}
        className={`${FIELD_CLASS} min-w-40 flex-1`}
      />
      <input
        aria-label={t.album.totalDuration}
        placeholder={DURATION_PLACEHOLDER}
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className={`${FIELD_CLASS} w-20 shrink-0 font-mono ${
          durationInvalid ? "border-destructive" : ""
        }`}
      />

      <button
        type="button"
        disabled={!dirty || durationInvalid || update.isPending}
        onClick={() =>
          update.mutate({
            id: track.id,
            title: title.trim(),
            trackNumber: number ? Number(number) : null,
            durationMs,
          })
        }
        className="border-border hover:bg-accent/30 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase disabled:opacity-40"
      >
        {update.isPending ? t.app.saving : t.app.save}
      </button>

      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => remove.mutate(track.id)}
        className="text-muted-foreground hover:text-destructive text-xs underline disabled:opacity-50"
      >
        {t.app.delete}
      </button>

      {(update.isError || remove.isError) && (
        <p role="alert" className="text-destructive w-full text-xs">
          {(update.error ?? remove.error)?.message}
        </p>
      )}
    </li>
  );
}

/** Exemple de durée : un format, pas un mot — identique dans toutes les langues. */
const DURATION_PLACEHOLDER = "4:31";

export function TracklistEditor({ albumId }: { albumId: string }) {
  const t = useT();
  const tracks = useTracks({ albumId, perPage: 100, sort: "createdAt" });
  const create = useCreateTrack();
  const [title, setTitle] = useState("");

  if (tracks.isPending) return <Skeleton className="h-40" />;
  if (tracks.isError) return <FormError>{tracks.error.message}</FormError>;

  const rows = [...tracks.data.data].sort(
    (a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0),
  );
  const nextNumber = rows.length + 1;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col">
        {rows.map((track) => (
          <TrackRowEditor key={track.id} track={track} />
        ))}
      </ul>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          create.mutate(
            { albumId, title: title.trim(), trackNumber: nextNumber },
            { onSuccess: () => setTitle("") },
          );
        }}
      >
        <input
          aria-label={t.admin.trackTitle}
          placeholder={t.admin.addTrack}
          value={title}
          maxLength={300}
          onChange={(e) => setTitle(e.target.value)}
          className={`${FIELD_CLASS} min-w-48 flex-1`}
        />
        <button
          type="submit"
          disabled={!title.trim() || create.isPending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase disabled:opacity-50"
        >
          {create.isPending ? t.app.saving : t.admin.addTrack}
        </button>
      </form>

      {create.isError && <FormError>{create.error.message}</FormError>}
    </div>
  );
}
