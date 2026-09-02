"use client";

/**
 * <DiscographyTable> — discographie d'un groupe : tableau des albums
 * dépliables. Chaque album déplié charge sa tracklist (GET /api/tracks
 * filtré par albumId) et les extraits Deezer du resolver média.
 */

// Requêtes albums/tracks + état de dépliage
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiJsonEnvelope } from "@/hooks/api/client";
import { albumKeys, trackKeys } from "@/hooks/api/queryKeys";
import {
  albumRowSchema,
  trackRowSchema,
  type AlbumRow,
} from "@/hooks/api/schemas";
import { z } from "zod";
// Tracklist avec dropdown plateformes
import {
  AlbumTracklist,
  type TrackPreview,
} from "@/components/albums/albumTracklist";
import { Skeleton } from "@/components/ui/skeleton";

const tracksPageSchema = z.object({
  data: z.array(trackRowSchema),
  meta: z.object({ total: z.number() }).passthrough(),
});

type DiscographyTableProps = {
  bandId: string;
  bandName: string;
};

/** Libellés français du type de sortie. */
const TYPE_LABELS: Record<AlbumRow["type"], string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  compilation: "Compilation",
  live: "Live",
  demo: "Démo",
};

export function DiscographyTable({ bandId, bandName }: DiscographyTableProps) {
  // Index de l'album déplié (un seul à la fois)
  const [openId, setOpenId] = useState<string | null>(null);

  // Discographie complète du groupe
  const albums = useQuery({
    queryKey: albumKeys.list({ bandId, perPage: 100 }),
    queryFn: async ({ signal }) => {
      const payload = await apiJsonEnvelope("/api/albums", {
        signal,
        query: { bandId, perPage: 100, sort: "year", order: "asc" },
      });
      return z.object({ data: z.array(albumRowSchema) }).parse(payload).data;
    },
  });

  if (albums.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  if (albums.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Impossible de charger la discographie.
      </p>
    );
  }

  const rows = albums.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun album référencé pour ce groupe.
      </p>
    );
  }

  return (
    <ul className="divide-border border-border divide-y rounded-lg border">
      {rows.map((album) => (
        <li key={album.id} className="bg-card">
          {/* Ligne album */}
          <button
            type="button"
            aria-expanded={openId === album.id}
            onClick={() => setOpenId(openId === album.id ? null : album.id)}
            className="hover:bg-accent/30 flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
          >
            <span className="text-muted-foreground w-12 font-mono text-sm">
              {album.releaseYear ?? "—"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {album.title}
            </span>
            <span className="border-border text-muted-foreground rounded border px-2 py-0.5 text-xs tracking-wide uppercase">
              {TYPE_LABELS[album.type]}
            </span>
            <span className="text-xs">{openId === album.id ? "▾" : "▸"}</span>
          </button>

          {/* Panneau déplié : tracklist + extraits */}
          {openId === album.id && (
            <div className="border-border/60 bg-background/40 border-t px-4 py-3">
              <TracklistLoader albumId={album.id} bandName={bandName} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Charge piste par piste (à l'ouverture uniquement) : tracks de l'album
 * + extraits Deezer correspondants depuis le média-complet.
 */
function TracklistLoader({
  albumId,
  bandName,
}: {
  albumId: string;
  bandName: string;
}) {
  // Tracks de l'album
  const tracks = useQuery({
    queryKey: trackKeys.list({ albumId }),
    queryFn: async ({ signal }) => {
      const payload = await apiJsonEnvelope("/api/tracks", {
        signal,
        query: { albumId, perPage: 100 },
      });
      return tracksPageSchema.parse(payload).data;
    },
  });

  // Extraits Deezer du groupe (cache partagé avec le détail)
  const previews = useQuery<TrackPreview[]>({
    queryKey: ["media", "previews", bandName],
    staleTime: 10 * 60_000,
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(bandName)}&limit=5`,
        {
          signal,
        },
      );
      if (!res.ok) return [];
      const json = (await res.json()) as {
        data?: {
          tracks?: { title: string; previewUrl: string; artistName: string }[];
        };
      };
      return (json.data?.tracks ?? [])
        .filter((t) => t.previewUrl)
        .map((t) => ({ title: t.title, previewUrl: t.previewUrl }));
    },
  });

  if (tracks.isPending) return <Skeleton className="h-24" />;
  if (tracks.isError)
    return (
      <p role="alert" className="text-destructive text-sm">
        Tracklist indisponible.
      </p>
    );

  const list = tracks.data ?? [];
  if (list.length === 0)
    return (
      <p className="text-muted-foreground text-sm">Aucune piste référencée.</p>
    );

  return (
    <AlbumTracklist
      tracks={list}
      artistName={bandName}
      previews={previews.data ?? []}
    />
  );
}
