"use client";

/**
 * <CoverImage> — pochette d'album, avec deux niveaux de repli.
 *
 * Les pochettes viennent de Cover Art Archive, qui redirige vers
 * l'Internet Archive : une lenteur ou une indisponibilité en amont fait
 * échouer l'optimiseur d'image de Next (504), et le navigateur affiche
 * alors l'icône d'image brisée avec le texte alternatif — pire que pas de
 * visuel du tout. Composant client uniquement pour cela : `onError`
 * n'existe pas côté serveur.
 *
 * Ordre de repli :
 *
 *   1. la pochette de l'œuvre ;
 *   2. le visuel du GROUPE — photo des musiciens ou logo officiel. Une
 *      part des démos et des captations live n'a aucune pochette
 *      archivée, et l'écran se couvrait de pictogrammes identiques ; le
 *      visuel du groupe, lui, identifie la sortie ;
 *   3. le pictogramme neutre, quand le groupe n'a pas de visuel non plus.
 *
 * Le repli du niveau 2 est signalé — assombri, et annoncé aux
 * technologies d'assistance : ce n'est PAS la pochette de l'œuvre, et
 * une encyclopédie ne doit pas laisser croire le contraire.
 */

import { ResilientImage } from "@/components/media/resilientImage";
import { useState } from "react";
import { ArtworkFallback } from "@/components/media/artworkFallback";

type CoverImageProps = {
  /** URL de la pochette, ou null si aucune n'est référencée. */
  src: string | null | undefined;
  /** Titre de l'album : texte alternatif et libellé du repli. */
  title: string;
  /** Tailles candidates transmises à l'optimiseur. */
  sizes: string;
  /** Visuel du groupe, utilisé si la pochette manque ou échoue. */
  bandImageUrl?: string | null;
  /** Nom du groupe, pour l'annonce du repli. */
  bandName?: string;
  /** Charge l'image sans attendre le défilement (candidats LCP). */
  priority?: boolean;
};

export function CoverImage({
  src,
  title,
  sizes,
  bandImageUrl,
  bandName,
  priority = false,
}: CoverImageProps) {
  // Deux échecs indépendants : la pochette peut tomber sans que le
  // visuel du groupe tombe, et inversement.
  const [coverFailed, setCoverFailed] = useState(false);
  const [bandFailed, setBandFailed] = useState(false);

  const useCover = Boolean(src) && !coverFailed;
  const useBand = !useCover && Boolean(bandImageUrl) && !bandFailed;

  if (useCover) {
    return (
      <ResilientImage
        src={src!}
        alt={`Pochette de ${title}`}
        fill
        sizes={sizes}
        priority={priority}
        // Le repli n'intervient qu'après épuisement des réessais : une
        // indisponibilité passagère de l'archive ne doit pas faire
        // basculer durablement la pochette sur le visuel du groupe.
        onExhausted={() => setCoverFailed(true)}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }

  if (useBand) {
    return (
      <ResilientImage
        src={bandImageUrl!}
        alt={
          bandName
            ? `Aucune pochette pour ${title} — visuel de ${bandName}`
            : `Aucune pochette pour ${title} — visuel du groupe`
        }
        fill
        sizes={sizes}
        // Le repli peut parfaitement être le Largest Contentful Paint :
        // sur une grille de démos sans pochette, c'est même la règle.
        priority={priority}
        onExhausted={() => setBandFailed(true)}
        // Légèrement retenu, pas effacé : il faut RECONNAÎTRE le groupe.
        // À 55 % d'opacité le visuel passait pour un bloc gris vide, ce
        // qui manquait le but — un repli qui n'identifie rien ne vaut pas
        // mieux qu'un pictogramme.
        className="scale-105 object-cover opacity-85 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100"
      />
    );
  }

  return (
    <ArtworkFallback kind="album" label={title} className="absolute inset-0" />
  );
}
