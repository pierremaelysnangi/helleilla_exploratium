"use client";

/**
 * <CommandPalette> — recherche rapide Ctrl+K (cmdk).
 * Montée globalement dans le layout racine : ouverture au raccourci
 * clavier, résultats live /api/search debouncés, navigation clavier
 * (flèches + Entrée) vers les pages détail.
 */

// Palette cmdk + navigation programmatique
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Recherche globale debouncée
import { useGlobalSearch } from "@/hooks/use-search";
import { useT } from "@/lib/i18n/client";

export function CommandPalette() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data } = useGlobalSearch({ q: query, limit: 5, debounceMs: 250 });

  // Raccourci global : Ctrl+K / Cmd+K ouvre, Échap referme (cmdk gère)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /** Navigation après sélection d'un résultat. */
  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Recherche rapide"
      shouldFilter={false} // filtrage serveur (Meilisearch), pas local
      className="border-border bg-card fixed inset-x-0 top-[15%] z-50 mx-auto max-w-xl overflow-hidden rounded-lg border shadow-2xl"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder={t.app.searchEverything}
        className="border-border w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="text-muted-foreground px-3 py-4 text-sm">
          {t.catalogue.noResult}
        </Command.Empty>

        {data && data.bands.length > 0 && (
          <Command.Group
            heading="Groupes"
            className="[&_[cmdk-group-heading]]:metal-title text-muted-foreground px-1 py-1 text-xs tracking-wide uppercase"
          >
            {data.bands.map((band) => (
              <Command.Item
                key={band.id}
                value={`band-${band.id}`}
                onSelect={() => go(`/bands/${band.slug}`)}
                className="data-[selected=true]:bg-accent/40 cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                {band.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {data && data.albums.length > 0 && (
          <Command.Group
            heading="Albums"
            className="text-muted-foreground px-1 py-1 text-xs tracking-wide uppercase"
          >
            {data.albums.map((album) => (
              <Command.Item
                key={album.id}
                value={`album-${album.id}`}
                onSelect={() =>
                  go(`/bands/${album.bandSlug}/albums/${album.slug}`)
                }
                className="data-[selected=true]:bg-accent/40 cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                {album.title}{" "}
                <span className="text-muted-foreground ml-1 text-xs">
                  {album.bandName} · {album.type}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {data && data.tracks.length > 0 && (
          <Command.Group
            heading="Pistes"
            className="text-muted-foreground px-1 py-1 text-xs tracking-wide uppercase"
          >
            {data.tracks.map((track) => (
              <Command.Item
                key={track.id}
                value={`track-${track.id}`}
                // La palette navigue avec le routeur Next : lui passer une
                // URL externe ne fonctionne pas. On ouvre l'album qui porte
                // la piste, d'où partent les liens d'écoute.
                onSelect={() =>
                  go(`/bands/${track.bandSlug}/albums/${track.albumSlug}`)
                }
                className="data-[selected=true]:bg-accent/40 cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                {track.title}{" "}
                <span className="text-muted-foreground ml-1 text-xs">
                  {track.bandName} · {track.albumTitle}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>

      {/* Astuce raccourci */}
      <div className="border-border text-muted-foreground border-t px-4 py-2 text-xs">
        <kbd>Ctrl</kbd>+<kbd>K</kbd> pour ouvrir · <kbd>{t.app.escape}</kbd>{" "}
        pour fermer
      </div>
    </Command.Dialog>
  );
}
