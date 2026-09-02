"use client";

/**
 * <BandMediaSection> — enrichissement média du détail groupe.
 * Charge progressivement GET /api/bands/:id/media (providers externes) :
 * - encadré « infos » : pays, période d'activité, membres actifs (les
 *   anciens repliés), genres dédoublonnés ;
 * - galerie d'images officielles (Discogs/Wikidata) ;
 * - liens externes officiels ;
 * - aperçus audio Deezer jouables inline (aucun média stocké).
 */

// Hook média + composants UI de base
import { useBandMedia } from "@/hooks/use-band-media";
import { Skeleton } from "@/components/ui/skeleton";
// Lecteur global : une seule piste joue à la fois dans toute l'application
import {
  useAudioPlayerStore,
  type PlayableTrack,
} from "@/stores/audioPlayer.store";

type BandMediaSectionProps = {
  bandId: string;
};

/**
 * Convertit un extrait du resolver en piste jouable.
 * L'URL sert d'identifiant : ces extraits n'ont pas d'id applicatif.
 */
function toPlayable(preview: {
  title: string;
  artistName: string;
  previewUrl: string;
}): PlayableTrack {
  return {
    id: preview.previewUrl,
    title: preview.title,
    artist: preview.artistName,
    src: preview.previewUrl,
    source: "deezer",
  };
}

/**
 * Formate la période d'activité.
 *
 * Un groupe toujours en activité s'affiche « 1991 – actif » plutôt que
 * « 1991 – … », qui se lit comme une donnée manquante alors que c'est
 * une information : le groupe n'a pas de date de fin.
 */
function formatActivity(lifeSpan: {
  begin?: string | null;
  end?: string | null;
  ended?: boolean;
}): string {
  const begin = lifeSpan.begin?.slice(0, 4) ?? "?";
  if (lifeSpan.end) return `${begin} – ${lifeSpan.end.slice(0, 4)}`;
  return lifeSpan.ended ? `${begin} – séparé` : `${begin} – actif`;
}

export function BandMediaSection({ bandId }: BandMediaSectionProps) {
  const { data: media, isPending, isError } = useBandMedia(bandId);
  // Hooks avant tout retour anticipé : leur ordre doit être stable d'un
  // rendu à l'autre, quel que soit l'état de la requête.
  const play = useAudioPlayerStore((s) => s.play);
  const currentId = useAudioPlayerStore((s) => s.current?.id ?? null);

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  // Panne totale des providers : section discrètement absente
  if (isError || !media) return null;

  const { info, images, links, previews, degraded } = media;
  const activeMembers = info.memberships.filter((m) => !m.ended);
  const pastMembers = info.memberships.filter((m) => m.ended);
  const hasInfo =
    info.area ||
    info.lifeSpan ||
    info.memberships.length > 0 ||
    info.genres.length > 0;

  return (
    <section
      aria-label="Informations et médias externes"
      className="flex flex-col gap-6"
    >
      {/* Indicateur discret de dégradation (une source en panne) */}
      {degraded && (
        <p className="text-muted-foreground text-xs">
          Certaines sources externes sont momentanément indisponibles —
          informations partielles.
        </p>
      )}

      {/* Infos structurées MusicBrainz + Wikidata */}
      {hasInfo && (
        <div className="metal-card p-4">
          <h2 className="metal-title text-sm">Informations</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {info.area && (
              <>
                <dt className="text-muted-foreground">Pays</dt>
                <dd>{info.area}</dd>
              </>
            )}
            {info.lifeSpan?.begin && (
              <>
                <dt className="text-muted-foreground">Activité</dt>
                <dd>{formatActivity(info.lifeSpan)}</dd>
              </>
            )}
            {activeMembers.length > 0 && (
              <>
                <dt className="text-muted-foreground">Membres</dt>
                <dd>
                  {activeMembers.map((m) => m.name).join(", ")}
                  {/* Anciens membres repliés : la fiche décrit le groupe
                      tel qu'il existe, l'historique reste consultable. */}
                  {pastMembers.length > 0 && (
                    <details className="mt-1">
                      <summary className="text-muted-foreground cursor-pointer text-xs">
                        Anciens membres ({pastMembers.length})
                      </summary>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {pastMembers.map((m) => m.name).join(", ")}
                      </p>
                    </details>
                  )}
                </dd>
              </>
            )}
            {info.genres.length > 0 && (
              <>
                <dt className="text-muted-foreground">Genres</dt>
                <dd>{info.genres.slice(0, 6).join(", ")}</dd>
              </>
            )}
          </dl>

          {/* Résumé encyclopédique Wikidata */}
          {info.wikidata?.extract && (
            <blockquote className="border-primary/40 text-muted-foreground mt-3 border-l-2 pl-3 text-sm italic">
              {info.wikidata.extract}
            </blockquote>
          )}
        </div>
      )}

      {/* Galerie d'images officielles (jamais copiées : URLs sources) */}
      {images.length > 0 && (
        <div>
          <h2 className="metal-title text-sm">Galerie</h2>
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {images.slice(0, 8).map((image, index) => (
              <li key={`${image.provider}-${index}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs hétérogènes multi-providers, dimensions libres */}
                <img
                  src={image.url}
                  alt={`Média ${index + 1} (${image.provider})`}
                  loading="lazy"
                  className="border-border h-32 w-auto rounded-md border object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aperçus audio Deezer (extraits 30 s hébergés par la plateforme).
          La lecture passe par le lecteur global : un <audio controls> par
          ligne permettait de superposer plusieurs extraits, et ses
          contrôles natifs débordaient du conteneur sur mobile. */}
      {previews.length > 0 && (
        <div>
          <h2 className="metal-title text-sm">Titres iconiques</h2>
          <ul className="divide-border border-border mt-3 flex flex-col divide-y rounded-lg border">
            {previews.map((preview, index) => (
              <li key={preview.previewUrl}>
                <button
                  type="button"
                  onClick={() =>
                    play(
                      toPlayable(preview),
                      previews.slice(index + 1).map(toPlayable),
                    )
                  }
                  aria-label={`Écouter un extrait de ${preview.title}`}
                  className="hover:bg-accent/30 flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                >
                  <span
                    aria-hidden
                    className="border-border text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px]"
                  >
                    {currentId === preview.previewUrl ? "❚❚" : "▶"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {preview.title}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    30 s
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liens officiels */}
      {links.length > 0 && (
        <div>
          <h2 className="metal-title text-sm">Liens officiels</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border hover:border-primary/50 rounded-md border px-3 py-1.5 text-xs tracking-wide uppercase transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
