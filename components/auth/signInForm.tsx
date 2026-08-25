"use client";

/**
 * <SignInForm> — formulaire de connexion.
 * Les messages d'erreur sont volontairement génériques côté serveur
 * (anti-énumération) ; pas de générateur ici, uniquement saisie +
 * autocomplete natif du gestionnaire de mots de passe.
 */

// Server Action de connexion
import { signInAction, type AuthFormState } from "@/lib/actions/auth";
import { useActionState } from "react";

export function SignInForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(signInAction, {});

  return (
    <form action={formAction}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />

        {state.error && (
          // Message unique : ne distingue jamais compte inexistant / mdp erroné
          <p role="alert" style={{ color: "#c62828" }}>
            {state.error}
          </p>
        )}

        <button type="submit" disabled={isPending}>
          {isPending ? "Connexion…" : "Se connecter"}
        </button>
      </div>
    </form>
  );
}
