"use client";

/**
 * <ProfileForm> — nom affiché et préférences de lecture.
 *
 * Deux natures de réglage cohabitent, et la distinction est explicitée à
 * l'utilisateur : le nom affiché est une donnée serveur, visible par les
 * autres ; le volume est une préférence locale à l'appareil, qui ne quitte
 * jamais le navigateur.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiJson, type ApiClientError } from "@/hooks/api/client";
import { updateProfileSchema } from "@/lib/validations/profile";
import { usePreferenceStore } from "@/stores/preference.store";
import { Skeleton } from "@/components/ui/skeleton";

/** Profil renvoyé par GET /api/profile. */
const profileSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  role: z.string(),
  updatedAt: z.string(),
});

type Profile = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const qc = useQueryClient();
  // `null` = champ non touché : la valeur affichée suit alors le serveur.
  // Dériver au rendu évite de synchroniser l'état depuis un effet.
  const [draftName, setDraftName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async ({ signal }): Promise<Profile> => {
      const data = await apiJson<unknown>("/api/profile", { signal });
      return profileSchema.parse(data);
    },
  });

  const save = useMutation<Profile, ApiClientError, string>({
    mutationFn: async (name) => {
      const body = updateProfileSchema.parse({ displayName: name });
      const data = await apiJson<unknown>("/api/profile", {
        method: "PATCH",
        body,
      });
      return profileSchema.parse(data);
    },
    onSuccess: () => {
      setSaved(true);
      // Le champ redevient piloté par le serveur après enregistrement
      setDraftName(null);
      void qc.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });

  const volume = usePreferenceStore((s) => s.volume);
  const muted = usePreferenceStore((s) => s.muted);
  const setVolume = usePreferenceStore((s) => s.setVolume);
  const toggleMuted = usePreferenceStore((s) => s.toggleMuted);

  if (profile.isPending) return <Skeleton className="h-40" />;
  if (profile.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Impossible de charger votre profil.
      </p>
    );
  }

  const displayName = draftName ?? profile.data.displayName;
  const dirty = displayName.trim() !== profile.data.displayName;

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) save.mutate(displayName.trim());
        }}
        className="flex flex-col gap-3"
      >
        <h2 className="metal-title text-lg">Profil public</h2>
        <p className="text-muted-foreground text-sm">
          Ce nom apparaît comme auteur de vos contributions.
        </p>

        <label className="max-w-sm">
          <span className="text-muted-foreground mb-1 block text-xs">
            Nom affiché
          </span>
          <input
            required
            maxLength={100}
            value={displayName}
            onChange={(e) => {
              setDraftName(e.target.value);
              setSaved(false);
            }}
            className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
          />
        </label>

        {save.isError && (
          <p role="alert" className="text-destructive text-sm">
            {save.error.message}
          </p>
        )}
        {saved && !dirty && (
          <p role="status" className="text-muted-foreground text-sm">
            Profil enregistré.
          </p>
        )}

        <button
          type="submit"
          disabled={!dirty || save.isPending}
          className="bg-primary text-primary-foreground self-start rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">Lecture</h2>
        <p className="text-muted-foreground text-sm">
          Ces réglages restent sur cet appareil : ils ne sont pas envoyés au
          serveur et ne suivent pas votre compte.
        </p>

        <label className="flex max-w-sm items-center gap-3">
          <span className="text-muted-foreground w-20 text-xs">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 text-right font-mono text-xs">
            {Math.round((muted ? 0 : volume) * 100)}%
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={muted} onChange={toggleMuted} />
          Couper le son par défaut
        </label>
      </section>
    </div>
  );
}
