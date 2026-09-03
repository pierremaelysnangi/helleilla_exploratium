"use client";

/**
 * Jauge de force de mot de passe basée sur zxcvbn (@zxcvbn-ts/core).
 * Contrairement à un simple compteur de caractères, zxcvbn évalue la
 * résistance réelle : dictionnaires de fuites connues, motifs clavier,
 * dates, substitutions l33t. Score 0–4 ; 3 exigé pour valider.
 */

// Moteur zxcvbn + dictionnaires communs (chargés une fois par bundle)
import { ZxcvbnFactory, type ZxcvbnResult } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import { useMemo } from "react";

// Options globales : dictionnaires communs (fr/en) — configurés au module
let zxcvbnInstance: {
  check: (p: string, u: (string | number)[]) => ZxcvbnResult;
} | null = null;
function ensureZxcvbn() {
  if (!zxcvbnInstance) {
    zxcvbnInstance = new ZxcvbnFactory({
      dictionary: {
        ...zxcvbnCommonPackage.dictionary,
      },
    });
  }
  return zxcvbnInstance;
}

/**
 * Résultat normalisé consommé par le composant de formulaire.
 *
 * Volontairement RÉDUIT au score : le libellé était produit ici, en
 * français, et se retrouvait tel quel devant un lecteur japonais. Le
 * score est un nombre, que le dictionnaire nomme dans sa langue.
 */
export type PasswordStrength = {
  /** 0 = très faible … 4 = excellent (zxcvbn). */
  score: 0 | 1 | 2 | 3 | 4;
  /** Estimations zxcvbn brutes (crack time, suggestions). */
  feedback: Pick<ZxcvbnResult, "feedback">["feedback"];
};

/**
 * Évalue un mot de passe de façon asynchrone (zxcvbn-async évite de
 * bloquer la frappe sur les longues entrées).
 *
 * @param password - Mot de passe en cours d'évaluation.
 * @param userInputs - Contextes interdits (email, pseudo…) : un mot de
 *   passe contenant ces valeurs est pénalisé automatiquement.
 */
export function usePasswordStrength(
  password: string,
  userInputs: string[] = [],
): PasswordStrength | null {
  return useMemo(() => {
    if (!password) return null;
    // Évaluation synchrone : le factory v4 est suffisamment rapide
    // pour un champ de formulaire (< 5 ms sur dictionnaire commun)
    const result = ensureZxcvbn().check(password, userInputs.slice(0, 5));
    const score = result.score as PasswordStrength["score"];
    return { score, feedback: result.feedback };
  }, [password, userInputs]);
}
