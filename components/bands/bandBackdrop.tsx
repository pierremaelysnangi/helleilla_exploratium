/**
 * <BandBackdrop> — visuel du groupe en fond de sa fiche.
 *
 * Server Component : une image et deux dégradés, sans état.
 *
 * L'image est très assombrie et fondue vers le fond de la page par le
 * haut ET par le bas. C'est une contrainte de lisibilité, pas un choix
 * esthétique : la fiche porte du texte long (biographie, tracklists,
 * liens) qui doit rester lisible quelle que soit la photo — une scène de
 * concert surexposée comme un logo blanc sur fond noir.
 *
 * `aria-hidden` : le visuel est purement décoratif ici, la même image
 * étant déjà présentée et décrite dans l'en-tête de la fiche. L'annoncer
 * deux fois n'apprendrait rien à un lecteur d'écran.
 */

import Image from "next/image";

type BandBackdropProps = {
  /** Visuel du groupe ; le fond n'est pas rendu s'il n'y en a pas. */
  imageUrl: string | null | undefined;
};

export function BandBackdrop({ imageUrl }: BandBackdropProps) {
  if (!imageUrl) return null;

  return (
    <div
      aria-hidden
      // `fixed` plutôt qu'`absolute` : le fond reste en place pendant le
      // défilement d'une fiche longue, au lieu de défiler avec elle et de
      // laisser le reste de la page sur un aplat nu.
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[70vh] select-none"
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-20"
      />
      {/* Fondu vers le fond de page : sans lui, la coupure basse de
          l'image traverse le contenu comme une ligne d'horizon. */}
      <div className="from-background/40 via-background/80 to-background absolute inset-0 bg-gradient-to-b" />
    </div>
  );
}
