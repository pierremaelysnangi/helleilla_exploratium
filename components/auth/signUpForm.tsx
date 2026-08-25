"use client";

/**
 * <SignUpForm> — formulaire d'inscription.
 * Compose : nom + email + <PasswordField> (générateur CSPRNG + jauge
 * zxcvbn) + Turnstile. La politique de mot de passe est vérifiée côté
 * client (score >= 3 ET 12 caractères) ET re-vérifiée serveur.
 */

// Server Action d'inscription + état d'erreur
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";
// Hook React 19 pour les formulaires avec action asynchrone
import { useActionState, useState } from "react";
// Champ mot de passe complet (générateur + jauge)
import {
  PasswordField,
  passwordMeetsPolicy,
  MIN_LENGTH,
} from "@/components/auth/passwordField";
// Jauge zxcvbn réutilisée pour le verrou de soumission
import { usePasswordStrength } from "@/hooks/use-password-strength";
// CAPTCHA invisible Cloudflare
import { TurnstileWidget } from "@/components/auth/turnstileWidget";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(signUpAction, {});
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Verrou client : longueur minimale + score zxcvbn suffisant
  const strength = usePasswordStrength(password, [email, name]);
  const policyOk = passwordMeetsPolicy(password, strength?.score ?? null);

  return (
    <form action={formAction}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label htmlFor="name">Nom affiché</label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordField
          value={password}
          onChange={setPassword}
          userInputs={[email, name]}
        />

        <TurnstileWidget />

        {/* Erreur générique renvoyée par la Server Action */}
        {state.error && (
          <p role="alert" style={{ color: "#c62828" }}>
            {state.error}
          </p>
        )}

        <button type="submit" disabled={isPending || !policyOk}>
          {isPending ? "Création…" : "Créer mon compte"}
        </button>
        {!policyOk && (
          <small>
            Mot de passe requis : {MIN_LENGTH} caractères minimum et score de
            force suffisant (utilisez « Générer »).
          </small>
        )}
      </div>
    </form>
  );
}
