"use client";

/**
 * <GenresView> — liste des genres avec filtre texte local.
 * Chaque carte renvoie vers la page du genre.
 */

// Requête TanStack + validation
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiJsonEnvelope } from "@/hooks/api/client";
import { genreKeys } from "@/hooks/api/queryKeys";
import { genreRowSchema } from "@/hooks/api/schemas";
import { useState } from "react";
// Présentation extraite : champ de filtre et carte de genre
import { GenreFilter } from "./genreFilter";
import { GenreCard } from "./genreCard";

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
      <GenreFilter
        value={filter}
        onChange={setFilter}
        resultCount={genres.isPending ? undefined : visible.length}
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
            <GenreCard genre={genre} />
          </li>
        ))}
      </ul>

      {!genres.isPending && visible.length === 0 && (
        <p className="text-muted-foreground">Aucun genre ne correspond.</p>
      )}
    </div>
  );
}
