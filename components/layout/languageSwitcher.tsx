"use client";

/**
 * <LanguageSwitcher> — choix de la langue de l'interface.
 *
 * Un `<form>` relié à une Server Action, et un `<select>` natif : le
 * contrôle reste utilisable au clavier, au lecteur d'écran et sur
 * mobile sans qu'on ait à le réimplémenter, et la soumission fonctionne
 * même si le JavaScript n'a pas été chargé.
 *
 * Le formulaire se soumet dès qu'une langue est choisie : personne ne
 * cherche un bouton de validation après avoir sélectionné sa langue.
 * Le bouton n'apparaît donc que pour les navigateurs sans JavaScript.
 */

import { useRef } from "react";
import { setLocaleAction } from "@/lib/actions/locale";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type LanguageSwitcherProps = {
  current: Locale;
  t: Dictionary;
};

export function LanguageSwitcher({ current, t }: LanguageSwitcherProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={setLocaleAction}
      className="flex items-center gap-2"
    >
      <label htmlFor="locale" className="sr-only">
        {t.nav.chooseLanguage}
      </label>

      <select
        id="locale"
        name="locale"
        defaultValue={current}
        aria-label={t.nav.chooseLanguage}
        // `requestSubmit` et non `submit` : lui seul déclenche la
        // soumission React qui porte la Server Action.
        onChange={() => formRef.current?.requestSubmit()}
        className="border-border bg-card hover:border-primary/50 rounded-md border px-2 py-1 text-xs transition-colors"
      >
        {LOCALES.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {locale.label}
          </option>
        ))}
      </select>

      <noscript>
        <button
          type="submit"
          className="border-border rounded-md border px-2 py-1 text-xs"
        >
          OK
        </button>
      </noscript>
    </form>
  );
}
