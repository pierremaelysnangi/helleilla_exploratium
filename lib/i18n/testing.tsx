/**
 * Rendu de test enveloppé du fournisseur de langue.
 *
 * Les composants d'interface lisent leurs libellés dans le contexte : les
 * rendre nus lève « useI18n doit être appelé sous <I18nProvider> ». Ce
 * helper évite de répéter l'enveloppe dans chaque fichier de test, et
 * garantit que tous exercent le MÊME dictionnaire.
 *
 * Le français est utilisé : c'est le dictionnaire de référence, celui
 * dont les autres dérivent, et les assertions restent lisibles.
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nProvider } from "./client";
import { fr } from "./locales/fr";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider locale="fr" t={fr}>
      {children}
    </I18nProvider>
  );
}

/** `render` de Testing Library, avec la langue déjà fournie. */
export function renderWithI18n(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: Wrapper, ...options });
}

/** Dictionnaire exercé par les tests, pour construire les attentes. */
export { fr as testDictionary };
