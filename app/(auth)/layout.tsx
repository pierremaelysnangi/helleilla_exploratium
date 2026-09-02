/**
 * Layout du segment d'authentification `(auth)`.
 *
 * Route group sans préfixe d'URL : /sign-in, /sign-up et la
 * réinitialisation de mot de passe partagent ce gabarit.
 *
 * Deux corrections par rapport à la version précédente :
 *
 * - plus de `<main>` imbriqué. Le layout racine en fournit déjà un, et
 *   deux régions principales dans une même page laissent un lecteur
 *   d'écran sans point d'entrée univoque ;
 * - plus de styles en ligne. Ces pages étaient les seules du site à
 *   ignorer la direction artistique : fond blanc, boutons par défaut du
 *   navigateur, aucun rapport avec le reste.
 */

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center py-8 sm:py-14">
      <div className="w-full max-w-[26rem]">
        {/* `metal-card` : même matière que les fiches du catalogue */}
        <div className="metal-card flex flex-col gap-5 p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
