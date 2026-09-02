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
// Classes de champ partagées avec les autres formulaires d'authentification
import { FIELD_CLASS } from "./authField";

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
    <div className="flex flex-col gap-2">
      <label htmlFor="password" className="text-sm font-medium">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          value={value}
          autoComplete="new-password"
          required
          minLength={MIN_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          className={`${FIELD_CLASS} flex-1`}
        />
      </div>

      {/* Actions du champ, sur leur propre ligne : à trois boutons, les
          aligner avec la saisie réduisait celle-ci à quelques caractères
          sur un écran de téléphone. */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            label: visible ? "Masquer" : "Afficher",
            onClick: () => setVisible((v) => !v),
            disabled: false,
          },
          { label: "Générer", onClick: handleGenerate, disabled: false },
          {
            label: "Copier",
            onClick: () => void handleCopy(),
            disabled: !value,
          },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="border-border hover:border-primary/50 rounded-md border px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Longueur générée souhaitée */}
      <label className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <span>Longueur générée : {generatedLength}</span>
        <input
          type="range"
          min={16}
          max={64}
          value={generatedLength}
          onChange={(e) => setGeneratedLength(Number(e.target.value))}
          className="accent-primary flex-1"
        />
        <span>
          ~
          {entropyBits(generatedLength, [
            "lowercase",
            "uppercase",
            "digits",
            "symbols",
          ])}{" "}
          bits (cible ≥ {MIN_ENTROPY_BITS})
        </span>
      </label>

      {/* Jauge zxcvbn */}
      {strength && (
        <div className="flex flex-col gap-1.5">
          <span aria-live="polite" className="text-muted-foreground text-xs">
            Force : {strength.label} ({strength.score}/4)
          </span>
          {/* Largeur proportionnelle au score, et non plus une barre
              pleine dont seule la couleur changeait : la progression se
              lit alors sans distinguer les couleurs. */}
          <div
            role="progressbar"
            aria-valuenow={strength.score}
            aria-valuemin={0}
            aria-valuemax={4}
            className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
          >
            <div
              className={`h-full rounded-full transition-all ${
                strength.score >= 3
                  ? "bg-emerald-500"
                  : strength.score === 2
                    ? "bg-amber-500"
                    : "bg-destructive"
              }`}
              style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
            />
          </div>
          {!meetsLength && (
            <p className="text-muted-foreground text-xs">
              Au moins {MIN_LENGTH} caractères requis.
            </p>
          )}
          {strength.feedback.suggestions.length > 0 && (
            <ul className="text-muted-foreground list-disc pl-4 text-xs">
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
