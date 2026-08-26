/**
 * Hook média d'un groupe : consomme GET /api/bands/:id/media (DTO
 * agrégé depuis les providers externes, cache 24 h côté serveur).
 */
"use client";

// Requête TanStack + clés média
import { useQuery, queryOptions } from "@tanstack/react-query";
import { apiJsonEnvelope } from "./api/client";
import { mediaKeys } from "./api/queryKeys";
import { bandMediaSchema, type BandMedia } from "./api/schemas";

/** Options de requête du média-complet (préfetch RSC possible). */
export function bandMediaOptions(id: string | undefined | null) {
  return queryOptions({
    queryKey: mediaKeys.band(id ?? ""),
    enabled: Boolean(id),
    queryFn: async ({ signal }): Promise<BandMedia> => {
      const payload = await apiJsonEnvelope(`/api/bands/${id}/media`, {
        signal,
      });
      return bandMediaSchema.parse(payload);
    },
    // Le resolver sert déjà depuis son propre cache serveur
    staleTime: 10 * 60_000,
  });
}

/** Hook de lecture du média-complet (inactif tant que `id` est vide). */
export function useBandMedia(id: string | undefined | null) {
  return useQuery(bandMediaOptions(id));
}
