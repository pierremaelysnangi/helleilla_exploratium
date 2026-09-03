"use client";

/**
 * <LanguageSwitcher> — choix de la langue, à la charte du site.
 *
 * Le `<select>` natif a été abandonné : il impose l'apparence du système
 * d'exploitation, qui jure avec le reste — bordure claire, coins carrés,
 * flèche grise — et il ne peut pas afficher la langue courante dans son
 * propre alphabet en même temps que la liste.
 *
 * À la place, un bouton et un panneau bâtis sur `metal-card`, avec la
 * même bordure et le même survol rouge que les autres commandes.
 * L'accessibilité est refaite à la main puisqu'on quitte le natif :
 * `aria-expanded`, fermeture par Échap, fermeture au clic extérieur, et
 * `aria-current` sur la langue active.
 *
 * Après le changement, la page est RECHARGÉE. Les textes sont produits
 * côté serveur : sans rechargement, seul ce qui est rendu par le client
 * changerait, et la page resterait à moitié dans l'ancienne langue.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Globe } from "lucide-react";
import { setLocaleAction } from "@/lib/actions/locale";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type LanguageSwitcherProps = {
  current: Locale;
  t: Dictionary;
};

export function LanguageSwitcher({ current, t }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    LOCALES.find((l) => l.code === current)?.label ?? current;

  // Échap et clic extérieur : attendus de tout panneau surgissant, et
  // absents dès qu'on quitte un contrôle natif.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function choose(locale: Locale) {
    setOpen(false);
    if (locale === current) return;

    startTransition(async () => {
      const data = new FormData();
      data.set("locale", locale);
      await setLocaleAction(data);
      // Rechargement complet : les textes viennent du serveur, et une
      // simple revalidation laisserait les composants clients déjà
      // montés dans la langue précédente.
      window.location.reload();
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t.nav.chooseLanguage}
        className="border-border hover:border-primary/50 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs tracking-wide uppercase transition-colors disabled:opacity-50"
      >
        <Globe aria-hidden className="h-3.5 w-3.5" />
        <span>{currentLabel}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t.nav.language}
          // `end-0` et non `right-0` : en arabe la mise en page est
          // retournée, et le panneau doit s'ouvrir du bon côté.
          className="metal-card absolute end-0 z-50 mt-2 max-h-80 w-52 overflow-y-auto p-1 shadow-xl"
        >
          {LOCALES.map((locale) => {
            const active = locale.code === current;
            return (
              <button
                key={locale.code}
                type="button"
                role="option"
                aria-selected={active}
                lang={locale.code}
                onClick={() => choose(locale.code)}
                className={`hover:bg-accent/40 flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors ${
                  active ? "text-primary font-semibold" : ""
                }`}
              >
                <span>{locale.label}</span>
                {active && <Check aria-hidden className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
