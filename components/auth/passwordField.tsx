"use client";

/**
 * <PasswordField> — champ mot de passe complet pour l'inscription :
 * - afficher/masquer ;
 * - bouton « Générer » (Web Crypto, voir use-password-generator) ;
 * - jauge zxcvbn temps réel (use-password-strength) avec exigences
 *   cochées : 12 caractères min. + score >= 3 pour autoriser la soumission.
 */

// Génération CSPRNG + évaluation zxcvbn
import {
  generatePassword,
  entropyBits,
  MIN_ENTROPY_BITS,
} from "@/hooks/use-password-generator";
import { usePasswordStrength } from "@/hooks/use-password-strength";
// État local du champ et de la visibilité
import { useState } from "react";

/** Props du champ. */
type PasswordFieldProps = {
  /** Valeur contrôlée par le formulaire parent. */
  value: string;
  onChange: (value: string) => void;
  /** Contextes interdits dans le mot de passe (email, pseudo). */
  userInputs?: string[];
  /** Libellé affiché au-dessus du champ. */
  label?: string;
};

/** Seuils de validation alignés côté serveur. */
export const MIN_LENGTH = 12;
export const MIN_SCORE = 3 as const;

/**
 * Champ contrôlé : expose via `onChange` la valeur ; le parent lit la
 * force retournée par sa propre instance de usePasswordStrength ou se
 * fie aux exigences affichées ici.
 */
export function PasswordField({
  value,
  onChange,
  userInputs = [],
  label = "Mot de passe",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [generatedLength, setGeneratedLength] = useState(20);
  const strength = usePasswordStrength(value, userInputs);

  /** Génère et remplit le champ avec un mot de passe CSPRNG. */
  function handleGenerate() {
    onChange(generatePassword({ length: generatedLength }));
    setVisible(true); // montrer ce qui vient d'être généré
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
  }

  const meetsLength = value.length >= MIN_LENGTH;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label htmlFor="password">{label}</label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={
            label.includes("confirmer") ? "new-password" : "new-password"
          }
          required
          minLength={MIN_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={() => setVisible((v) => !v)}>
          {visible ? "Masquer" : "Afficher"}
        </button>
        <button type="button" onClick={handleGenerate}>
          Générer
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!value}
        >
          Copier
        </button>
      </div>

      {/* Longueur générée souhaitée */}
      <label style={{ fontSize: "0.85em" }}>
        Longueur générée : {generatedLength}{" "}
        <input
          type="range"
          min={16}
          max={64}
          value={generatedLength}
          onChange={(e) => setGeneratedLength(Number(e.target.value))}
        />{" "}
        (~
        {entropyBits(generatedLength, [
          "lowercase",
          "uppercase",
          "digits",
          "symbols",
        ])}{" "}
        bits, cible ≥ {MIN_ENTROPY_BITS})
      </label>

      {/* Jauge zxcvbn */}
      {strength && (
        <div>
          <span aria-live="polite">
            Force : {strength.label} ({strength.score}/4)
          </span>
          <div
            role="progressbar"
            aria-valuenow={strength.score}
            aria-valuemin={0}
            aria-valuemax={4}
            style={{
              height: 6,
              background:
                strength.score >= 3
                  ? "#2e7d32"
                  : strength.score === 2
                    ? "#f9a825"
                    : "#c62828",
              borderRadius: 3,
            }}
          />
          {!meetsLength && (
            <small>Au moins {MIN_LENGTH} caractères requis.</small>
          )}
          {strength.feedback.suggestions.length > 0 && (
            <ul style={{ fontSize: "0.85em" }}>
              {strength.feedback.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Exigences transmises à la validation du formulaire */}
      <input
        type="hidden"
        name="passwordMeetsPolicy"
        value={meetsLength && (strength?.score ?? 0) >= MIN_SCORE ? "1" : "0"}
      />
    </div>
  );
}

/**
 * Vérification partagée client/serveur : le formulaire n'est soumis que
 * si la politique est respectée (longueur + score zxcvbn).
 */
export function passwordMeetsPolicy(
  password: string,
  score: number | null,
): boolean {
  return password.length >= MIN_LENGTH && (score ?? 0) >= MIN_SCORE;
}
