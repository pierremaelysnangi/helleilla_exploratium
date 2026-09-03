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
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";

/** Profil renvoyé par GET /api/profile. */
const profileSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  role: z.string(),
  updatedAt: z.string(),
});

type Profile = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const t = useT();
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

  if (profile.isPending) return <Skeleton className="h-40" />;
  if (profile.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {t.app.profileLoadFailed}
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
        <h2 className="metal-title text-lg">{t.profile.publicProfile}</h2>
        <p className="text-muted-foreground text-sm">{t.app.displayNameHint}</p>

        <label className="max-w-sm">
          <span className="text-muted-foreground mb-1 block text-xs">
            {t.app.displayName}
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
            {t.app.profileSaved}
          </p>
        )}

        <button
          type="submit"
          disabled={!dirty || save.isPending}
          className="bg-primary text-primary-foreground self-start rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? t.app.saving : t.app.save}
        </button>
      </form>
    </div>
  );
}
