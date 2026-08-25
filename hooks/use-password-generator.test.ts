/**
 * Tests de la politique mot de passe et du générateur CSPRNG.
 * Vérifie : denylist, longueur/alphabet/classes/unicité du générateur,
 * garantie d'un caractère par classe et calcul d'entropie.
 */
import { describe, it, expect } from "vitest";
import { isPasswordDenylisted } from "@/lib/auth/password-policy";
import {
  generatePassword,
  entropyBits,
  MIN_ENTROPY_BITS,
} from "./use-password-generator";

describe("isPasswordDenylisted", () => {
  it("rejette les mots de passe les plus fuités (insensible à la casse)", () => {
    expect(isPasswordDenylisted("password123")).toBe(true);
    expect(isPasswordDenylisted("PASSWORD123")).toBe(true);
    expect(isPasswordDenylisted("motdepasse123")).toBe(true);
  });

  it("accepte un mot de passe hors liste", () => {
    expect(isPasswordDenylisted("K9#mVx2\$pLq7!wRtZb3@N4fQ")).toBe(false);
  });
});

describe("generatePassword", () => {
  const CLASSES = ["lowercase", "uppercase", "digits", "symbols"] as const;

  it("génère la longueur demandée (bornes 12–64)", () => {
    expect(generatePassword({ length: 12 })).toHaveLength(12);
    expect(generatePassword({ length: 64 })).toHaveLength(64);
    expect(generatePassword()).toHaveLength(20); // défaut
  });

  it("refuse les longueurs hors bornes", () => {
    expect(() => generatePassword({ length: 8 })).toThrow(/Longueur/);
    expect(() => generatePassword({ length: 100 })).toThrow(/Longueur/);
  });

  it("n'utilise que l'alphabet des classes sélectionnées", () => {
    const pw = generatePassword({
      length: 64,
      classes: ["lowercase", "digits"],
    });
    expect(pw).toMatch(/^[a-z0-9]+$/);
  });

  it("garantit au moins un caractère par classe sélectionnée", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ length: 16, classes: [...CLASSES] });
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it("produit des mots de passe uniques (CSPRNG, pas Math.random)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(generatePassword({ length: 24 }));
    expect(seen.size).toBe(200);
  });
});

describe("entropyBits", () => {
  it("calcule log2(alphabet^longueur)", () => {
    // 26 minuscules -> log2(26) ≈ 4.70 ; 20 chars ≈ 94 bits
    const bits = entropyBits(20, ["lowercase"]);
    expect(bits).toBeGreaterThan(90);
    expect(bits).toBeLessThan(96);
  });

  it("l'alphabet complet à 20 caractères dépasse le seuil de sécurité", () => {
    expect(
      entropyBits(20, ["lowercase", "uppercase", "digits", "symbols"]),
    ).toBeGreaterThanOrEqual(MIN_ENTROPY_BITS);
  });

  it("retourne 0 sans classe ni longueur", () => {
    expect(entropyBits(0, ["lowercase"])).toBe(0);
    expect(entropyBits(10, [])).toBe(0);
  });
});
