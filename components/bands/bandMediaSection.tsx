"use client";

/**
 * <BandMediaSection> — enrichissement média du détail groupe.
 * Charge progressivement GET /api/bands/:id/media (providers externes) :
 * - encadré « infos » : zone, période MusicBrainz, membres, genres MB ;
 * - galerie d'images officielles (Discogs/Wikidata) ;
 * - liens externes officiels ;
 * - aperçus audio Deezer jouables inline (aucun média stocké).
 */

// Hook média + composants UI de base
import { useBandMedia } from "@/hooks/use-band-media";
import { Skeleton } from "@/components/ui/skeleton";

type BandMediaSectionProps = {
  bandId: string;
};

export function BandMediaSection({ bandId }: BandMediaSectionProps) {
  const { data: media, isPending, isError } = useBandMedia(bandId);

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
  const hasInfo = info.area || info.lifeSpan || info.members.length > 0;

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
                <dt className="text-muted-foreground">Zone</dt>
                <dd>{info.area}</dd>
              </>
            )}
            {info.lifeSpan?.begin && (
              <>
                <dt className="text-muted-foreground">
                  Activité (MusicBrainz)
                </dt>
                <dd>
                  {info.lifeSpan.begin} – {info.lifeSpan.end ?? "…"}
                </dd>
              </>
            )}
            {info.members.length > 0 && (
              <>
                <dt className="text-muted-foreground">Membres</dt>
                <dd>{info.members.map((m) => m.name).join(", ")}</dd>
              </>
            )}
            {info.genres.length > 0 && (
              <>
                <dt className="text-muted-foreground">Genres (MB)</dt>
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

      {/* Aperçus audio Deezer (extraits 30 s hébergés par la plateforme) */}
      {previews.length > 0 && (
        <div>
          <h2 className="metal-title text-sm">Aperçus audio</h2>
          <ul className="divide-border border-border mt-3 flex flex-col divide-y rounded-lg border">
            {previews.map((preview) => (
              <li
                key={preview.previewUrl}
                className="flex items-center gap-3 px-4 py-2"
              >
                <audio
                  controls
                  preload="none"
                  src={preview.previewUrl}
                  className="h-8 max-w-[240px]"
                />
                <span className="min-w-0 truncate text-sm">
                  {preview.title}
                </span>
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
