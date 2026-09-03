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
import { useT } from "@/lib/i18n/client";

export function SignInForm() {
  const t = useT();
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
        label={t.account.emailLabel}
        required
        maxLength={200}
        autoComplete="email"
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        label={t.password.label}
        required
        autoComplete="current-password"
      />

      {/* Message unique : ne distingue jamais compte inexistant et mot de
          passe erroné, sans quoi le formulaire deviendrait un moyen de
          vérifier qu'une adresse est inscrite. */}
      {state.error && <AuthError>{state.error}</AuthError>}

      <AuthSubmit pending={isPending}>
        {/* Un verbe, pas le libellé du menu : le bouton dit ce qu'il
            fait, l'onglet dit où l'on est. */}
        {isPending ? t.account.signingIn : t.account.signInAction}
      </AuthSubmit>
    </form>
  );
}
