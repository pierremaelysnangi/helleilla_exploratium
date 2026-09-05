/**
 * Tests de la mise en forme des durées (lib/media/duration.ts).
 *
 * Ces fonctions étaient dupliquées entre la tracklist et la fiche
 * d'album : des règles divergentes y auraient produit un total ne
 * correspondant pas aux lignes qu'il résume.
 */

import { describe, it, expect } from "vitest";
import {
  formatTrackDuration,
  parseTrackDuration,
  formatTotalDuration,
  totalDurationIso,
} from "./duration";

describe("formatTrackDuration", () => {
  it("formate en minutes:secondes, secondes sur deux chiffres", () => {
    expect(formatTrackDuration(495_000)).toBe("8:15");
    expect(formatTrackDuration(287_934)).toBe("4:48");
    expect(formatTrackDuration(41_000)).toBe("0:41");
  });

  it("distingue une durée nulle d'une durée inconnue", () => {
    // Zéro est une valeur, `null` une absence : les confondre afficherait
    // un tiret là où la piste dure réellement moins d'une seconde.
    expect(formatTrackDuration(0)).toBe("0:00");
    expect(formatTrackDuration(null)).toBe("—");
    expect(formatTrackDuration(undefined)).toBe("—");
  });
});

describe("formatTotalDuration", () => {
  it("cumule et bascule en heures au-delà de soixante minutes", () => {
    expect(formatTotalDuration([{ durationMs: 2_820_000 }])?.label).toBe(
      "47 min",
    );
    expect(formatTotalDuration([{ durationMs: 4_320_000 }])?.label).toBe(
      "1 h 12 min",
    );
    expect(formatTotalDuration([{ durationMs: 7_200_000 }])?.label).toBe("2 h");
  });

  it("signale un total incomplet", () => {
    const partiel = formatTotalDuration([
      { durationMs: 240_000 },
      { durationMs: null },
    ]);
    expect(partiel?.partial).toBe(true);

    const complet = formatTotalDuration([{ durationMs: 240_000 }]);
    expect(complet?.partial).toBe(false);
  });

  it("ne renvoie rien quand aucune piste n'est minutée", () => {
    // « 0 min » serait faux : l'album dure, on ignore combien.
    expect(formatTotalDuration([{ durationMs: null }])).toBeNull();
    expect(formatTotalDuration([])).toBeNull();
  });
});

describe("totalDurationIso", () => {
  it("produit une durée ISO 8601 exploitable par schema.org", () => {
    expect(totalDurationIso([{ durationMs: 495_000 }])).toBe("PT8M15S");
  });

  it("renvoie null plutôt qu'une durée nulle", () => {
    expect(totalDurationIso([{ durationMs: null }])).toBeNull();
  });
});

describe("parseTrackDuration", () => {
  it("convertit une saisie « m:ss »", () => {
    expect(parseTrackDuration("4:31")).toBe(271_000);
    expect(parseTrackDuration("0:07")).toBe(7_000);
  });

  it("accepte les durées de plus d'une heure", () => {
    // Certains albums de doom tiennent en un seul morceau.
    expect(parseTrackDuration("72:00")).toBe(4_320_000);
  });

  it("fait l'aller-retour avec le formatage", () => {
    expect(formatTrackDuration(parseTrackDuration("9:05")!)).toBe("9:05");
  });

  it("renvoie null sur une saisie vide", () => {
    expect(parseTrackDuration("")).toBeNull();
    expect(parseTrackDuration("   ")).toBeNull();
  });

  it("refuse une forme ambiguë plutôt que de deviner", () => {
    // « 4:5 » peut vouloir dire 4 min 5 s ou 4 min 50 s : on ne tranche
    // pas à la place de la personne, on lui signale la faute.
    expect(parseTrackDuration("4:5")).toBeNull();
    expect(parseTrackDuration("4:61")).toBeNull();
    expect(parseTrackDuration("431")).toBeNull();
    expect(parseTrackDuration("quatre minutes")).toBeNull();
  });
});
