"use client";

/**
 * <PasswordField> — champ mot de passe complet pour l'inscription :
 * - afficher/masquer ;
 * - bouton « Générer » (Web Crypto, voir use-password-generator) ;
 * - jauge zxcvbn temps réel (use-password-strength) avec exigences
 *   cochées : 12 caractères min. + score >= 3 pour autoriser la soumission.
 */

// Génération CSPRNG + évaluation zxcvbn
import { generatePassword } from "@/hooks/use-password-generator";
import { usePasswordStrength } from "@/hooks/use-password-strength";
// État local du champ et de la visibilité
import { useState } from "react";
// Classes de champ partagées avec les autres formulaires d'authentification
import { FIELD_CLASS } from "./authField";
import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

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
 * Ce qu'un mot de passe doit satisfaire, énoncé pour la personne qui le
 * choisit — et non après coup, sous forme de refus.
 *
 * Volontairement PAS de « une majuscule, un chiffre, un symbole » : ces
 * règles produisent des mots de passe courts et prévisibles. La longueur
 * et le score zxcvbn, eux, mesurent la résistance réelle.
 */
const REQUIREMENTS: {
  label: (t: Dictionary) => string;
  test: (value: string, score: number | null) => boolean;
}[] = [
  {
    label: (t) =>
      interpolate(t.password.requirementLength, { min: MIN_LENGTH }),
    test: (value) => value.length >= MIN_LENGTH,
  },
  {
    label: (t) => t.password.requirementGuess,
    test: (_value, score) => score !== null && score >= MIN_SCORE,
  },
  {
    label: (t) => t.password.requirementPersonal,
    test: (value, score) => value.length > 0 && score !== null && score >= 2,
  },
];

/** Nom de chaque palier zxcvbn, du plus faible au plus fort. */
const STRENGTH_KEYS = [
  "strength0",
  "strength1",
  "strength2",
  "strength3",
  "strength4",
] as const;

/**
 * Champ contrôlé : expose via `onChange` la valeur ; le parent lit la
 * force retournée par sa propre instance de usePasswordStrength ou se
 * fie aux exigences affichées ici.
 */
export function PasswordField({
  value,
  onChange,
  userInputs = [],
  label,
}: PasswordFieldProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [generatedLength, setGeneratedLength] = useState(20);
  const strength = usePasswordStrength(value, userInputs);

  /**
   * Génère et remplit le champ avec un mot de passe CSPRNG.
   *
   * Le champ RESTE masqué. L'afficher automatiquement exposait le mot de
   * passe à toute personne présente dans la pièce ou derrière une
   * caméra, au moment précis où il a le plus de valeur. Le bouton
   * « Copier » suffit à l'usage courant, et « Afficher » reste
   * disponible pour qui veut le lire.
   */
  function handleGenerate() {
    onChange(generatePassword({ length: generatedLength }));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
  }

  const meetsLength = value.length >= MIN_LENGTH;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="password" className="text-sm font-medium">
        {label ?? t.password.label}
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
            label: visible ? t.password.hide : t.password.show,
            onClick: () => setVisible((v) => !v),
            disabled: false,
          },
          {
            label: t.password.generate,
            onClick: handleGenerate,
            disabled: false,
          },
          {
            label: t.password.copy,
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

      {/* Exigences énoncées AVANT la saisie : les découvrir en échouant
          au moment de valider est la pire façon de les apprendre. */}
      <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
        {REQUIREMENTS.map((requirement) => {
          const met = requirement.test(value, strength?.score ?? null);
          const text = requirement.label(t);
          return (
            <li key={text} className="flex items-start gap-2">
              <span
                aria-hidden
                className={met ? "text-emerald-500" : "text-muted-foreground"}
              >
                {met ? "✓" : "○"}
              </span>
              <span className={met ? "text-foreground" : undefined}>
                {text}
              </span>
              {/* Doublon textuel pour les lecteurs d'écran : la coche
                  seule n'est pas annoncée. */}
              <span className="sr-only">
                {met ? t.password.met : t.password.notMet}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Longueur générée souhaitée */}
      <label className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <span>
          {interpolate(t.password.generatedLength, {
            length: generatedLength,
          })}
        </span>
        <input
          type="range"
          min={16}
          max={64}
          value={generatedLength}
          onChange={(e) => setGeneratedLength(Number(e.target.value))}
          className="accent-primary flex-1"
        />
      </label>

      {/* Jauge zxcvbn */}
      {strength && (
        <div className="flex flex-col gap-1.5">
          <span aria-live="polite" className="text-muted-foreground text-xs">
            {interpolate(t.password.strength, {
              label: t.password[STRENGTH_KEYS[strength.score]],
              score: strength.score,
            })}
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
              {interpolate(t.password.minLengthNotice, { min: MIN_LENGTH })}
            </p>
          )}
          {/* Les suggestions brutes de zxcvbn ne sont PAS affichées :
              la bibliothèque les produit en anglais, et la liste
              d'exigences ci-dessus dit déjà, dans la langue du visiteur,
              ce qu'il faut corriger. */}
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
