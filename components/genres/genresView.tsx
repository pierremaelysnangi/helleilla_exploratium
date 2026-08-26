"use client";

/**
 * <GenresView> — liste des genres avec filtre texte local.
 * Chaque carte renvoie vers le catalogue filtré sur ce genre.
 */

// Requête TanStack + validation
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiJsonEnvelope } from "@/hooks/api/client";
import { genreKeys } from "@/hooks/api/queryKeys";
import { genreRowSchema } from "@/hooks/api/schemas";
import { useState } from "react";

const genresPageSchema = z.object({
  data: z.array(genreRowSchema),
  meta: z.object({ total: z.number() }).passthrough(),
});

export function GenresView() {
  const [filter, setFilter] = useState("");

  const genres = useQuery({
    queryKey: genreKeys.list({ perPage: 200 }),
    queryFn: async ({ signal }) => {
      const payload = await apiJsonEnvelope("/api/genres", {
        signal,
        query: { perPage: 200 },
      });
      return genresPageSchema.parse(payload).data;
    },
  });

  // Filtre purement local (la liste complète tient en une page)
  const visible = (genres.data ?? []).filter((g) =>
    g.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        placeholder="Filtrer les genres…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Filtrer les genres"
        className="border-border bg-card focus:border-primary/50 w-full max-w-xs rounded-md border px-3 py-2 text-sm outline-none"
      />

      {genres.isPending && (
        <p className="text-muted-foreground">Chargement des genres…</p>
      )}
      {genres.isError && (
        <p role="alert" className="text-destructive text-sm">
          Impossible de charger les genres.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {visible.map((genre) => (
          <li key={genre.id}>
            {/* Le catalogue bands accepte ?q= : réutilise la recherche SQL */}
            <a
              href={`/bands?q=${encodeURIComponent(genre.name)}`}
              className="metal-card hover:bg-accent/30 block px-4 py-3 text-center"
            >
              <span className="text-sm font-semibold tracking-wide uppercase">
                {genre.name}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {!genres.isPending && visible.length === 0 && (
        <p className="text-muted-foreground">Aucun genre ne correspond.</p>
      )}
    </div>
  );
}
