"use client";

/**
 * <SignInForm> — formulaire de connexion.
 *
 * Les messages d'erreur sont volontairement génériques côté serveur
 * (anti-énumération : jamais « ce compte n'existe pas ») ; pas de
 * générateur ici, uniquement la saisie et l'autocomplétion native du
 * gestionnaire de mots de passe.
 */

import { signInAction, type AuthFormState } from "@/lib/actions/auth";
import { useActionState } from "react";
import { AuthField, AuthSubmit, AuthError } from "./authField";

export function SignInForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(signInAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="email"
        name="email"
        type="email"
        label="Adresse e-mail"
        required
        maxLength={200}
        autoComplete="email"
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        label="Mot de passe"
        required
        autoComplete="current-password"
      />

      {/* Message unique : ne distingue jamais compte inexistant et mot de
          passe erroné, sans quoi le formulaire deviendrait un moyen de
          vérifier qu'une adresse est inscrite. */}
      {state.error && <AuthError>{state.error}</AuthError>}

      <AuthSubmit pending={isPending}>
        {isPending ? "Connexion…" : "Se connecter"}
      </AuthSubmit>
    </form>
  );
}
