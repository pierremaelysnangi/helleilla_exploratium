/**
 * Tests de la négociation de langue (lib/i18n/locales.ts).
 *
 * La langue est déduite de l'en-tête `Accept-Language` et non du pays :
 * un visiteur en Belgique peut lire le néerlandais ou le français, et
 * c'est son navigateur qui le sait.
 */

import { describe, it, expect } from "vitest";
import {
  negotiateLocale,
  isLocale,
  localeDir,
  DEFAULT_LOCALE,
} from "./locales";

describe("negotiateLocale", () => {
  it("respecte l'ordre de préférence pondéré", () => {
    // L'anglais est mieux noté que l'allemand malgré sa position
    expect(negotiateLocale("de;q=0.5,en;q=0.9")).toBe("en");
  });

  it("ramène une variante régionale à sa langue", () => {
    expect(negotiateLocale("pt-BR,pt;q=0.9")).toBe("pt");
    expect(negotiateLocale("zh-Hans-CN")).toBe("zh");
    expect(negotiateLocale("en-GB")).toBe("en");
  });

  it("traite le norvégien `no` comme du bokmål", () => {
    // `no` est le macro-code : les navigateurs l'envoient encore, alors
    // que nos textes sont en bokmål.
    expect(negotiateLocale("no")).toBe("nb");
  });

  it("ignore une langue que l'interface ne propose pas", () => {
    expect(negotiateLocale("is,fr;q=0.5")).toBe("fr");
  });

  it("retombe sur la langue par défaut sans en-tête exploitable", () => {
    expect(negotiateLocale(null)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale("")).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale("xx-YY")).toBe(DEFAULT_LOCALE);
  });
});

describe("isLocale et localeDir", () => {
  it("reconnaît les langues proposées", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("kl")).toBe(false);
  });

  it("annonce l'arabe comme écrit de droite à gauche", () => {
    expect(localeDir("ar")).toBe("rtl");
    expect(localeDir("fr")).toBe("ltr");
  });
});
