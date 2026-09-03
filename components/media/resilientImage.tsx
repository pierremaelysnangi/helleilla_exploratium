"use client";

/**
 * <ResilientImage> — image distante qui se recharge d'elle-même après un
 * échec.
 *
 * Les visuels du catalogue viennent tous d'ailleurs : Wikimedia Commons,
 * Cover Art Archive (qui redirige vers l'Internet Archive), Deezer. Ces
 * services répondent parfois par un 503 ou expirent, et l'optimiseur
 * d'images de Next relaie l'échec. Le navigateur affiche alors le texte
 * alternatif dans un cadre vide, définitivement : rien, dans une page
 * rendue, ne retente jamais une image.
 *
 * Ce composant retente. Chaque tentative ajoute un paramètre à l'URL,
 * ce qui change la clé de cache de l'optimiseur et le force à
 * redemander la ressource en amont — sans quoi il resservirait son
 * échec mémorisé.
 *
 * L'attente CROÎT entre les essais, et le nombre d'essais est borné. Un
 * rechargement toutes les secondes, sans fin, martèlerait des services
 * publics et gratuits — Wikimedia et l'Internet Archive plafonnent les
 * clients trop insistants, et l'on obtiendrait l'inverse du but
 * recherché : des images définitivement refusées. La montée progressive
 * laisse le temps à une panne passagère de se résoudre, et l'appelant
 * est prévenu quand il faut passer à un autre visuel.
 */

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

/** Délai avant le premier réessai. */
const FIRST_DELAY_MS = 400;
/** Plafond du délai : au-delà, l'attente ne sert plus le lecteur. */
const MAX_DELAY_MS = 8_000;
/** Nombre de réessais avant d'abandonner et de prévenir l'appelant. */
const MAX_ATTEMPTS = 6;

type ResilientImageProps = Omit<ImageProps, "onError" | "src"> & {
  src: string;
  /** Appelé quand tous les réessais ont échoué. */
  onExhausted?: () => void;
};

export function ResilientImage({
  src,
  alt,
  onExhausted,
  className,
  ...rest
}: ResilientImageProps) {
  /** Numéro du réessai en cours ; 0 = premier chargement. */
  const [attempt, setAttempt] = useState(0);
  /** Vrai entre l'échec et le réessai : l'espace reste occupé. */
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!retrying) return;

    if (attempt >= MAX_ATTEMPTS) {
      onExhausted?.();
      return;
    }

    // Croissance géométrique, plafonnée : 0,4 s, 0,8 s, 1,6 s…
    const delay = Math.min(FIRST_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
    const timer = setTimeout(() => {
      setAttempt((n) => n + 1);
      setRetrying(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [retrying, attempt, onExhausted]);

  // Le paramètre de réessai change la clé de cache de l'optimiseur : sans
  // lui, il resservirait l'échec qu'il vient de mémoriser.
  const separator = src.includes("?") ? "&" : "?";
  const url = attempt === 0 ? src : `${src}${separator}retry=${attempt}`;

  return (
    <>
      <Image
        // `key` force le remontage : changer la seule `src` ne relance pas
        // toujours le chargement d'un élément déjà en erreur.
        key={url}
        src={url}
        alt={alt}
        onError={() => setRetrying(true)}
        className={className}
        {...rest}
      />

      {/* Pendant l'attente, l'espace n'est jamais nu : un fond animé
          remplace le cadre vide et son texte alternatif. */}
      {retrying && (
        <span
          aria-hidden
          className="bg-muted absolute inset-0 animate-pulse rounded-[inherit]"
        />
      )}
    </>
  );
}
