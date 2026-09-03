"use client";

/**
 * <BandGallery> — photos d'un groupe, créditées et agrandissables.
 *
 * Trois exigences, toutes trois absentes de la version précédente :
 *
 * - **des photos, et rien d'autre.** La galerie mêlait pochettes
 *   d'album rapportées par les plateformes et visuels du groupe. Une
 *   pochette montre une œuvre, pas un groupe, et la discographie les
 *   présente déjà à leur place ;
 * - **créditées.** Les photos viennent de Wikimedia Commons, sous
 *   licence libre — laquelle exige d'en créditer l'auteur. Chaque
 *   vignette mène donc à la page du fichier, où figurent auteur,
 *   licence et historique ;
 * - **interactive.** Une vignette de 128 px ne montre rien d'un concert.
 *   Le clic agrandit, Échap referme.
 *
 * L'agrandissement utilise `<dialog>` natif : le navigateur gère le
 * piège de focus, la fermeture par Échap et le fond inerte, là où une
 * ré-implémentation en `div` les perd presque toujours.
 */

import { useEffect, useRef, useState } from "react";
import { ResilientImage } from "@/components/media/resilientImage";
import type { BandMedia } from "@/hooks/api/schemas";

type GalleryImage = BandMedia["images"][number];

/** Libellé de la nature d'un visuel. */
const KIND_LABELS: Record<GalleryImage["kind"], string> = {
  photo: "Photo",
  logo: "Logo",
};

export function BandGallery({
  images,
  bandName,
}: {
  images: GalleryImage[];
  bandName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // `showModal()` est impératif : c'est lui qui rend le fond inerte et
  // installe le piège de focus. Un simple attribut `open` ne le fait pas.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openIndex !== null && !dialog.open) dialog.showModal();
    if (openIndex === null && dialog.open) dialog.close();
  }, [openIndex]);

  if (images.length === 0) return null;

  const current = openIndex === null ? null : images[openIndex];

  return (
    <div className="flex flex-col gap-2">
      <h2 className="metal-title text-sm">Galerie</h2>

      <ul className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <li key={image.url}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Agrandir : ${KIND_LABELS[image.kind].toLowerCase()} de ${bandName}`}
              className="border-border hover:border-primary/50 group relative block h-32 w-44 overflow-hidden rounded-md border transition-colors"
            >
              <ResilientImage
                src={image.url}
                alt={`${KIND_LABELS[image.kind]} de ${bandName}`}
                fill
                sizes="176px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground text-xs">
        Photos hébergées par leurs plateformes d&apos;origine. Auteur et licence
        sur la page de chaque fichier.
      </p>

      <dialog
        ref={dialogRef}
        onClose={() => setOpenIndex(null)}
        // Le clic sur le fond ferme : `<dialog>` reçoit l'événement quand
        // il tombe hors du contenu, ce que ce test distingue.
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpenIndex(null);
        }}
        className="bg-card text-foreground border-border m-auto max-h-[90dvh] w-[min(56rem,92vw)] rounded-lg border p-0 backdrop:bg-black/80"
      >
        {current && (
          <div className="flex flex-col gap-3 p-4">
            <div className="bg-muted relative h-[60dvh] w-full">
              {/* C'est à l'agrandissement que l'échec se voyait le plus :
                  la vignette avait pu passer, mais la taille demandée ici
                  relance une requête vers l'amont. */}
              <ResilientImage
                src={current.url}
                alt={`${KIND_LABELS[current.kind]} de ${bandName}`}
                fill
                sizes="(max-width: 900px) 92vw, 56rem"
                className="object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Le crédit nomme l'auteur, sans redire ce que le bouton
                  voisin propose déjà d'ouvrir. */}
              <p className="text-muted-foreground text-xs">
                {KIND_LABELS[current.kind]} de {bandName}
                {current.author ? ` par ${current.author}` : ""}
                {current.licence ? ` · ${current.licence}` : ""}
              </p>

              <div className="flex items-center gap-2">
                {current.sourceUrl && (
                  <a
                    href={current.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:border-primary/50 rounded-md border px-3 py-1.5 text-xs tracking-wide uppercase transition-colors"
                  >
                    Voir la source ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  className="border-border hover:border-primary/50 rounded-md border px-3 py-1.5 text-xs tracking-wide uppercase transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
