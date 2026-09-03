/**
 * <MediaBackdrop> — visuel de fond d'une fiche.
 *
 * Server Component : une image et un dégradé, sans état. Partagé par les
 * fiches de groupe et d'album, qui suivaient chacune leur propre réglage
 * d'opacité et finissaient par ne plus se ressembler.
 *
 * L'image est adoucie et fondue vers le fond de page par le bas. C'est
 * une contrainte de lisibilité, pas un choix esthétique : ces pages
 * portent du texte long — biographie, tracklist, liens — qui doit rester
 * lisible sous une scène de concert surexposée comme sous une pochette
 * blanche.
 *
 * `aria-hidden` : le visuel est décoratif ici, la même image étant déjà
 * présentée et décrite dans l'en-tête. L'annoncer deux fois n'apprendrait
 * rien à un lecteur d'écran.
 */

import Image from "next/image";

type MediaBackdropProps = {
  /** Visuel de fond ; rien n'est rendu s'il n'y en a pas. */
  imageUrl: string | null | undefined;
};

export function MediaBackdrop({ imageUrl }: MediaBackdropProps) {
  if (!imageUrl) return null;

  return (
    <div
      aria-hidden
      // `fixed` plutôt qu'`absolute` : le fond reste en place pendant le
      // défilement d'une fiche longue, au lieu de défiler avec elle et de
      // laisser le reste de la page sur un aplat nu.
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[75vh] select-none"
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        // `eager` mais PAS `priority`. Ce fond occupe les trois quarts
        // de la fenêtre : c'est lui que le navigateur retient comme
        // Largest Contentful Paint, et le charger paresseusement
        // retardait la mesure. `priority` irait plus loin en posant un
        // lien de préchargement — mais l'en-tête demande déjà la même
        // image à une autre taille, et le navigateur signalait alors un
        // préchargement inutilisé.
        loading="eager"
        sizes="100vw"
        // `blur` léger : une pochette porte du texte et des motifs fins
        // qui, nets, rivalisent avec le contenu de la page.
        className="scale-105 object-cover object-center opacity-55 blur-[2px]"
      />
      {/* Fondu vers le fond de page : sans lui, la coupure basse de
          l'image traverse le contenu comme une ligne d'horizon. */}
      <div className="from-background/10 via-background/60 to-background absolute inset-0 bg-gradient-to-b" />
    </div>
  );
}

/** Fond d'une fiche de groupe. */
export { MediaBackdrop as BandBackdrop };
/** Fond d'une fiche d'album : sa pochette, ou le visuel du groupe. */
export { MediaBackdrop as AlbumBackdrop };
