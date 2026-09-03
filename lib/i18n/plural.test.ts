/**
 * Tests des accords en nombre.
 *
 * Le cas qui a motivé ce module est réel : `{n} groupe{n > 1 ? "s" : ""}`
 * imposait la grammaire française aux quinze langues. Le russe compte
 * quatre formes, l'arabe six et le japonais aucune — ce sont ces trois
 * extrêmes qui sont vérifiés ici.
 */

import { describe, it, expect } from "vitest";
import { plural, type PluralForms } from "./plural";

describe("plural", () => {
  const fr: PluralForms = { one: "{n} groupe", other: "{n} groupes" };

  it("choisit le singulier français à zéro et à un", () => {
    // Particularité du français : 0 relève de la catégorie « one ».
    expect(plural("fr", fr, 0)).toBe("0 groupe");
    expect(plural("fr", fr, 1)).toBe("1 groupe");
    expect(plural("fr", fr, 2)).toBe("2 groupes");
  });

  it("suit la règle anglaise, qui sépare zéro du singulier", () => {
    const en: PluralForms = { one: "{n} band", other: "{n} bands" };
    expect(plural("en", en, 0)).toBe("0 bands");
    expect(plural("en", en, 1)).toBe("1 band");
  });

  it("distingue les quatre catégories du russe", () => {
    const ru: PluralForms = {
      one: "{n} группа",
      few: "{n} группы",
      many: "{n} групп",
      other: "{n} группы",
    };
    expect(plural("ru", ru, 1)).toBe("1 группа");
    expect(plural("ru", ru, 3)).toBe("3 группы");
    expect(plural("ru", ru, 5)).toBe("5 групп");
    // 21 repart sur « one » : c'est la finale qui commande, pas la taille.
    expect(plural("ru", ru, 21)).toBe("21 группа");
  });

  it("retombe sur « other » quand la langue n'emploie pas la catégorie", () => {
    // Le japonais ne décline pas : un dictionnaire n'y déclare que `other`.
    const ja: PluralForms = { other: "{n} バンド" };
    expect(plural("ja", ja, 1)).toBe("1 バンド");
    expect(plural("ja", ja, 7)).toBe("7 バンド");
  });

  it("emploie les chiffres et les catégories propres à l'arabe", () => {
    const ar: PluralForms = {
      zero: "{n} فرقة",
      one: "فرقة واحدة",
      two: "فرقتان",
      few: "{n} فرق",
      many: "{n} فرقة",
      other: "{n} فرقة",
    };
    expect(plural("ar", ar, 1)).toBe("فرقة واحدة");
    expect(plural("ar", ar, 2)).toBe("فرقتان");
    // Chiffres latins : depuis CLDR 42, c'est le système par défaut de
    // l'arabe non régionalisé. Les chiffres arabo-indiens ne
    // reviendraient que pour « ar-EG » ou « ar-SA ».
    expect(plural("ar", ar, 3)).toBe("3 فرق");
  });

  it("formate le nombre selon la langue", () => {
    const forms: PluralForms = { one: "{n}", other: "{n}" };
    expect(plural("de", forms, 12000)).toBe("12.000");
    expect(plural("en", forms, 12000)).toBe("12,000");
  });

  it("accepte des marqueurs supplémentaires", () => {
    const forms: PluralForms = { other: "{n} sur {min}" };
    expect(plural("fr", forms, 1, { min: 2 })).toBe("1 sur 2");
  });
});
