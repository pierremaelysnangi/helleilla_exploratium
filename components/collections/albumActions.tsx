"use client";

/**
 * <AlbumActions> — note personnelle et liste de l'utilisateur pour un album.
 *
 * Les deux gestes cohabitent parce qu'ils répondent à la même question sur
 * la page d'un album : « qu'est-ce que j'en pense, et est-ce que je l'ai ? »
 *
 * La moyenne est TOUJOURS affichée avec son nombre de votes : une note
 * sans effectif laisse croire à un consensus qui n'existe peut-être pas.
 * Un visiteur non connecté voit la moyenne mais ne peut pas voter — les
 * contrôles sont alors absents plutôt que désactivés sans explication.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiJson, type ApiClientError } from "@/hooks/api/client";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

/** Agrégat renvoyé par /api/albums/:id/ratings. */
const ratingSummarySchema = z.object({
  average: z.number().nullable(),
  count: z.number(),
  mine: z.number().nullable(),
});

type RatingSummary = z.infer<typeof ratingSummarySchema>;

/** Entrée de collection, réduite à ce dont ce composant a besoin. */
const collectionEntrySchema = z.object({
  albumId: z.string(),
  status: z.enum(["owned", "wanted"]),
});

const SCORES = [1, 2, 3, 4, 5] as const;

type AlbumActionsProps = {
  albumId: string;
};

export function AlbumActions({ albumId }: AlbumActionsProps) {
  const qc = useQueryClient();
  const { data: session } = useSession();

  const ratings = useQuery({
    queryKey: ["ratings", albumId],
    queryFn: async ({ signal }): Promise<RatingSummary> => {
      const data = await apiJson<unknown>(`/api/albums/${albumId}/ratings`, {
        signal,
      });
      return ratingSummarySchema.parse(data);
    },
  });

  const collection = useQuery({
    // Requête personnelle : inutile et indiscrète pour un visiteur anonyme
    enabled: Boolean(session),
    queryKey: ["collection", "me"],
    queryFn: async ({ signal }) => {
      const data = await apiJson<unknown>("/api/me/collection", { signal });
      return z.array(collectionEntrySchema).parse(data);
    },
  });

  const rate = useMutation<RatingSummary, ApiClientError, number>({
    mutationFn: async (score) => {
      const data = await apiJson<unknown>(`/api/albums/${albumId}/ratings`, {
        method: "PUT",
        body: { score },
      });
      return ratingSummarySchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ratings", albumId] });
    },
  });

  const setStatus = useMutation<unknown, ApiClientError, "owned" | "wanted">({
    mutationFn: (status) =>
      apiJson<unknown>("/api/me/collection", {
        method: "PUT",
        body: { albumId, status },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["collection", "me"] });
    },
  });

  const remove = useMutation<unknown, ApiClientError, void>({
    mutationFn: () =>
      apiJson<unknown>("/api/me/collection", {
        method: "DELETE",
        query: { albumId },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["collection", "me"] });
    },
  });

  const summary = ratings.data;
  const mine = summary?.mine ?? null;
  const entry = collection.data?.find((e) => e.albumId === albumId);

  return (
    <section
      aria-label="Appréciation et collection"
      className="metal-card flex flex-col gap-4 p-4"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="metal-title text-base">Appréciation</h2>
        {summary && (
          <p className="text-muted-foreground text-sm">
            {summary.count === 0 ? (
              "Aucune note pour l'instant"
            ) : (
              <>
                <span className="text-foreground font-mono">
                  {summary.average}/5
                </span>{" "}
                · {summary.count} vote{summary.count > 1 ? "s" : ""}
              </>
            )}
          </p>
        )}
      </div>

      {session ? (
        <div className="flex flex-col gap-3">
          <div
            role="group"
            aria-label="Votre note"
            className="flex items-center gap-2"
          >
            {SCORES.map((score) => (
              <button
                key={score}
                type="button"
                aria-pressed={mine === score}
                disabled={rate.isPending}
                onClick={() => rate.mutate(score)}
                className={
                  mine !== null && score <= mine
                    ? "border-primary/50 bg-primary/20 h-9 w-9 rounded-md border text-sm"
                    : "border-border hover:bg-accent/30 h-9 w-9 rounded-md border text-sm"
                }
              >
                {score}
              </button>
            ))}
            {mine !== null && (
              <span className="text-muted-foreground text-xs">
                votre note : {mine}/5
              </span>
            )}
          </div>

          {rate.isError && (
            <p role="alert" className="text-destructive text-sm">
              {rate.error.message}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Ma liste :</span>
            {(["owned", "wanted"] as const).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={entry?.status === status}
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate(status)}
                className={
                  entry?.status === status
                    ? "border-primary/50 bg-primary/20 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
                    : "border-border hover:bg-accent/30 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
                }
              >
                {status === "owned" ? "Je l'ai" : "Je le veux"}
              </button>
            ))}
            {entry && (
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
                className="text-muted-foreground hover:text-destructive text-xs underline"
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          <Link href="/sign-in" className="hover:text-foreground underline">
            Connectez-vous
          </Link>{" "}
          pour noter cet album et l&apos;ajouter à votre liste.
        </p>
      )}
    </section>
  );
}
