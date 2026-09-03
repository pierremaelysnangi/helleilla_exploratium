/**
 * Tests de la projection linguistique des groupes servis par l'API.
 *
 * Deux garanties : la bonne biographie, et surtout l'absence du
 * dictionnaire de traductions dans la réponse — l'envoyer ferait
 * voyager quinze versions d'un texte dont une seule sera lue.
 */

import { describe, it, expect } from "vitest";
import { localizeBand } from "./localize";

const row = {
  id: "b1",
  name: "Emperor",
  bio: "Groupe norvégien formé à Notodden.",
  bioTranslations: { en: "Norwegian band formed in Notodden." },
};

describe("localizeBand", () => {
  it("résout la biographie dans la langue demandée", () => {
    expect(localizeBand(row, "en").bio).toBe(row.bioTranslations.en);
  });

  it("garde le texte d'origine pour une langue non traduite", () => {
    expect(localizeBand(row, "ja").bio).toBe(row.bio);
  });

  it("ne traduit pas quand aucune langue n'est demandée", () => {
    // Un client externe qui appelle l'API sans paramètre reçoit le texte
    // tel qu'il a été saisi, pas une langue devinée pour lui.
    expect(localizeBand(row, undefined).bio).toBe(row.bio);
  });

  it("retire le dictionnaire des traductions de la réponse", () => {
    expect("bioTranslations" in localizeBand(row, "en")).toBe(false);
  });

  it("laisse les autres champs intacts", () => {
    const out = localizeBand(row, "en");
    expect(out.id).toBe("b1");
    expect(out.name).toBe("Emperor");
  });
});
