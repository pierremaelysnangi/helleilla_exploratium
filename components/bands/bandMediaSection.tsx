"use client";

/**
 * <BandMediaSection> — enrichissement média du détail groupe.
 * Charge progressivement GET /api/bands/:id/media (providers externes) :
 * - encadré « infos » : pays, membres actifs (les anciens repliés) et
 *   genres dédoublonnés. La période d'activité n'y figure PAS : elle est
 *   déjà portée par l'en-tête de fiche, à partir des données locales, et
 *   l'afficher deux fois exposait deux périodes contradictoires quand
 *   MusicBrainz et l'encyclopédie divergent ;
 * - galerie de photos créditées ;
 * - liens officiels, du plus direct au moins direct.
 */

// Hook média + composants UI de base
import { useBandMedia } from "@/hooks/use-band-media";
import { Skeleton } from "@/components/ui/skeleton";
import { BandGallery } from "./bandGallery";

type BandMediaSectionProps = {
  bandId: string;
  /** Nom du groupe : texte alternatif et crédits de la galerie. */
  bandName: string;
};

export function BandMediaSection({ bandId, bandName }: BandMediaSectionProps) {
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

  const { info, images, links, degraded } = media;
  const activeMembers = info.memberships.filter((m) => !m.ended);
  const pastMembers = info.memberships.filter((m) => m.ended);
  const hasInfo =
    info.area || info.memberships.length > 0 || info.genres.length > 0;

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

      {/* Galerie : photos créditées, agrandissables (jamais copiées) */}
      <BandGallery images={images} bandName={bandName} />

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
