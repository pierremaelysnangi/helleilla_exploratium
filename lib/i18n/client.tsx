"use client";

/**
 * Accès au dictionnaire depuis les composants clients.
 *
 * La langue est résolue une seule fois, côté serveur, puis descendue par
 * contexte. L'alternative — passer `t` en prop à chaque composant —
 * aurait traversé une dizaine de niveaux pour des libellés isolés, sans
 * rien apporter : le dictionnaire ne change pas pendant la vie d'une
 * page, un changement de langue rechargeant tout.
 *
 * Le contexte n'a pas de valeur par défaut : un composant client qui
 * appelle `useT()` hors du fournisseur est une erreur de câblage, et il
 * vaut mieux la voir immédiatement qu'afficher du français à un lecteur
 * japonais.
 */

import { createContext, useContext, useMemo } from "react";
import type { Dictionary } from "./dictionaries";
import type { Locale } from "./locales";
import { plural, type PluralForms } from "./plural";

type I18nValue = {
  locale: Locale;
  t: Dictionary;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  t,
  children,
}: I18nValue & { children: React.ReactNode }) {
  // L'objet est recréé à chaque rendu du layout, ce qui n'arrive qu'au
  // chargement d'une page : mémoriser n'apporterait rien.
  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Dictionnaire et langue de la page en cours. */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error(
      "useI18n doit être appelé sous <I18nProvider> (voir providers.tsx).",
    );
  }
  return value;
}

/** Raccourci : le dictionnaire seul, cas le plus fréquent. */
export function useT(): Dictionary {
  return useI18n().t;
}

/**
 * Accord en nombre, déjà lié à la langue de la page.
 *
 * Évite de faire remonter `locale` jusqu'à chaque compteur : le seul
 * usage qu'en aurait l'appelant est celui-ci.
 *
 * @example
 *   const n = usePlural();
 *   <span>{n(t.count.bands, total)}</span>
 */
export function usePlural() {
  const { locale } = useI18n();
  return useMemo(
    () =>
      (
        forms: PluralForms,
        count: number,
        values?: Record<string, string | number>,
      ) =>
        plural(locale, forms, count, values),
    [locale],
  );
}
