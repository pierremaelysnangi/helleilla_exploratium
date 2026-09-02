"use client";

/**
 * <CoverImage> — pochette d'album avec repli sur monogramme.
 *
 * Les pochettes viennent de Cover Art Archive, qui redirige vers
 * l'Internet Archive : une lenteur ou une indisponibilité en amont fait
 * échouer l'optimiseur d'image de Next (504), et le navigateur affiche
 * alors l'icône d'image brisée avec le texte alternatif — pire que pas de
 * visuel du tout.
 *
 * Composant client uniquement pour cela : `onError` n'existe pas côté
 * serveur. Le repli est le même monogramme que pour un album sans
 * pochette référencée, donc l'incident passe inaperçu.
 */

import Image from "next/image";
import { useState } from "react";

type CoverImageProps = {
  /** URL de la pochette, ou null si aucune n'est référencée. */
  src: string | null | undefined;
  /** Titre de l'album : texte alternatif et lettre du monogramme. */
  title: string;
  /** Tailles candidates transmises à l'optimiseur. */
  sizes: string;
};

/** Monogramme : première lettre du titre sur fond acier. */
function Monogram({ title }: { title: string }) {
  return (
    <span
      aria-hidden
      className="font-heading text-muted-foreground absolute inset-0 flex items-center justify-center text-4xl font-black uppercase"
    >
      {title.charAt(0)}
    </span>
  );
}

export function CoverImage({ src, title, sizes }: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <Monogram title={title} />;

  return (
    <Image
      src={src}
      alt={`Pochette de ${title}`}
      fill
      sizes={sizes}
      onError={() => setFailed(true)}
      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />
  );
}
