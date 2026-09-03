/**
 * Tests de la résolution linguistique du contenu encyclopédique.
 *
 * Contrairement aux textes d'interface, une biographie n'existe pas
 * forcément dans les quinze langues : elle est écrite par des
 * contributeurs. Le comportement à garantir n'est donc pas « traduire »
 * mais « ne jamais laisser un blanc ».
 */

import { describe, it, expect } from "vitest";
import { localizedText } from "./content";

describe("localizedText", () => {
  const original = "Groupe norvégien formé à Notodden.";
  const translations = { en: "Norwegian band formed in Notodden." };

  it("sert la traduction quand elle existe", () => {
    expect(localizedText(original, translations, "en")).toBe(translations.en);
  });

  it("retombe sur le texte d'origine pour une langue non traduite", () => {
    // Le japonais n'est pas encore écrit : mieux vaut du français lisible
    // qu'une fiche amputée de sa biographie.
    expect(localizedText(original, translations, "ja")).toBe(original);
  });

  it("ignore une traduction vide ou blanche", () => {
    expect(localizedText(original, { en: "   " }, "en")).toBe(original);
    expect(localizedText(original, { en: "" }, "en")).toBe(original);
  });

  it("renvoie null quand il n'y a rien à afficher", () => {
    expect(localizedText(null, {}, "fr")).toBeNull();
    expect(localizedText("   ", {}, "fr")).toBeNull();
    expect(localizedText(undefined, undefined, "fr")).toBeNull();
  });
});
