"use client";

/**
 * <PressReviews> — critiques de presse d'un album.
 *
 * Pendant professionnel de <AlbumActions>, qui porte les notes des
 * auditeurs. Les deux sont affichés CÔTE À CÔTE sur la page d'un album :
 * une critique de presse et une moyenne d'auditeurs ne disent pas la
 * même chose, et les empiler laissait croire que l'une prime.
 *
 * Aucun extrait n'est reproduit : la publication, la note ramenée sur
 * 100 et le lien vers l'article original. Le texte des critiques
 * appartient à ses auteurs et à leurs publications.
 */

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiJson } from "@/hooks/api/client";
import { Skeleton } from "@/components/ui/skeleton";

const pressReviewSchema = z.object({
  id: z.string(),
  outlet: z.string(),
  author: z.string().nullable(),
  score: z.number().nullable(),
  url: z.string(),
  publishedAt: z.string().nullable(),
});

const pressPayloadSchema = z.object({
  reviews: z.array(pressReviewSchema),
  average: z.number().nullable(),
  count: z.number(),
});

/** Année d'une date ISO, ou null si la date est absente. */
function year(value: string | null): string | null {
  return value ? value.slice(0, 4) : null;
}

export function PressReviews({ albumId }: { albumId: string }) {
  const press = useQuery({
    queryKey: ["press-reviews", albumId],
    queryFn: async ({ signal }) => {
      const data = await apiJson<unknown>(
        `/api/albums/${albumId}/press-reviews`,
        { signal },
      );
      return pressPayloadSchema.parse(data);
    },
  });

  return (
    <section
      aria-label="Critiques de presse"
      className="metal-card flex flex-col gap-4 p-4"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="metal-title text-base">Presse</h3>
        {press.data && (
          <p className="text-muted-foreground text-sm">
            {press.data.count === 0 ? (
              "Aucune critique référencée"
            ) : (
              <>
                <span className="text-foreground font-mono">
                  {press.data.average}/100
                </span>{" "}
                · {press.data.count} critique
                {press.data.count > 1 ? "s" : ""}
              </>
            )}
          </p>
        )}
      </div>

      {press.isPending && <Skeleton className="h-20" />}

      {press.isError && (
        <p role="alert" className="text-destructive text-sm">
          Critiques de presse indisponibles.
        </p>
      )}

      {press.data && press.data.reviews.length > 0 && (
        <ul className="divide-border divide-y">
          {press.data.reviews.map((review) => (
            <li key={review.id} className="py-2 first:pt-0 last:pb-0">
              <a
                href={review.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-accent/30 -mx-2 flex items-baseline gap-3 rounded-md px-2 py-1 transition-colors"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {review.outlet} ↗
                  </span>
                  {(review.author || year(review.publishedAt)) && (
                    <span className="text-muted-foreground block truncate text-xs">
                      {[review.author, year(review.publishedAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                {review.score !== null && (
                  <span className="shrink-0 font-mono text-sm">
                    {review.score}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      {press.data && press.data.reviews.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Les critiques de presse sont documentées par les contributeurs, avec
          un lien vers l&apos;article d&apos;origine. Aucun texte n&apos;est
          reproduit ici.
        </p>
      )}
    </section>
  );
}
