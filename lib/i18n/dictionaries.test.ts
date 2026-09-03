/**
 * Cohérence des quinze dictionnaires.
 *
 * Le typage garantit déjà qu'aucune clé ne manque : `Dictionary` est
 * dérivé du français, et une traduction incomplète ne compile pas. Ce
 * qu'il ne voit pas, c'est le CONTENU des chaînes — et c'est là que les
 * traductions se cassent silencieusement :
 *
 * - un marqueur mal recopié (`{lien}` au lieu de `{link}`) laisse le
 *   marqueur affiché tel quel devant le visiteur ;
 * - une forme de pluriel déclarée sous une catégorie que la langue
 *   n'emploie pas ne sera jamais choisie ;
 * - une catégorie `other` manquante ferait s'effondrer le repli.
 *
 * Ces trois pièges passent la compilation. Ils ne passent pas ici.
 */

import { describe, it, expect } from "vitest";
import { LOCALES, type Locale } from "./locales";
import { getDictionary } from "./dictionaries";
import { fr } from "./locales/fr";

/** Les marqueurs `{clé}` d'un texte, dans l'ordre alphabétique. */
function markersOf(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

/** Catégories de pluriel du CLDR, seules valeurs admises. */
const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];

const codes = LOCALES.map((l) => l.code);

describe("dictionnaires", () => {
  it("couvre chaque langue déclarée", () => {
    for (const code of codes) {
      expect(getDictionary(code as Locale)).toBeDefined();
    }
  });

  describe.each(codes)("%s", (code) => {
    const dict = getDictionary(code as Locale);

    it("n'emploie que des marqueurs présents dans le texte français", () => {
      for (const [section, entries] of Object.entries(fr)) {
        if (section === "count") continue;
        for (const [key, french] of Object.entries(entries)) {
          const translated = (
            dict as unknown as Record<string, Record<string, string>>
          )[section][key];
          const allowed = new Set(markersOf(french as string));
          for (const marker of markersOf(translated)) {
            expect(
              allowed.has(marker),
              `${code}.${section}.${key} : marqueur {${marker}} inconnu du français`,
            ).toBe(true);
          }
        }
      }
    });

    it("déclare des formes de pluriel valides et complètes", () => {
      for (const [key, forms] of Object.entries(dict.count)) {
        const categories = Object.keys(forms);
        expect(
          categories.length,
          `${code}.count.${key} est vide`,
        ).toBeGreaterThan(0);
        for (const category of categories) {
          expect(
            PLURAL_CATEGORIES,
            `${code}.count.${key} : catégorie « ${category} » inconnue`,
          ).toContain(category);
        }
        // `other` est le repli : sans elle, une catégorie non déclarée
        // ne renverrait rien du tout.
        expect(
          categories,
          `${code}.count.${key} n'a pas de forme « other »`,
        ).toContain("other");
        expect(
          forms.other,
          `${code}.count.${key}.other doit porter le nombre`,
        ).toContain("{n}");
      }
    });

    it("déclare exactement les catégories que la langue emploie", () => {
      // Une forme rangée sous une catégorie inutilisée par la langue ne
      // serait jamais choisie : c'est une traduction morte. Le sondage
      // inclut des décimaux — en russe et en polonais, « other » ne sort
      // que pour eux, jamais pour un entier, et l'omettre du sondage
      // aurait fait passer le repli obligatoire pour une forme morte.
      const rules = new Intl.PluralRules(code);
      const used = new Set([
        ...Array.from({ length: 200 }, (_, n) => rules.select(n)),
        ...[0.5, 1.5, 2.5, 10.5].map((n) => rules.select(n)),
      ]);
      for (const [key, forms] of Object.entries(dict.count)) {
        for (const category of Object.keys(forms)) {
          expect(
            used.has(category as Intl.LDMLPluralRule),
            `${code}.count.${key} : « ${category} » n'est jamais choisie en ${code}`,
          ).toBe(true);
        }
      }
    });

    it("ne laisse aucune chaîne vide", () => {
      for (const [section, entries] of Object.entries(dict)) {
        if (section === "count") continue;
        for (const [key, value] of Object.entries(
          entries as Record<string, string>,
        )) {
          expect(value.trim(), `${code}.${section}.${key} est vide`).not.toBe(
            "",
          );
        }
      }
    });
  });
});
