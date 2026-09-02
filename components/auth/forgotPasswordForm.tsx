"use client";

/**
 * <ForgotPasswordForm> — demande de réinitialisation.
 * Réponse toujours identique (succès ou email inconnu) : anti-énumération.
 */

// Server Action + état
import {
  requestPasswordResetAction,
  type ResetFormState,
} from "@/lib/actions/password-reset";
import { useActionState } from "react";
import { TurnstileWidget } from "@/components/auth/turnstileWidget";
import { AuthField, AuthSubmit, AuthError } from "./authField";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ResetFormState,
    FormData
  >(requestPasswordResetAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="email"
        name="email"
        type="email"
        label="Adresse e-mail du compte"
        required
        maxLength={200}
        autoComplete="email"
      />

      <TurnstileWidget />

      {/* Succès ET erreur anti-énumération : mêmes messages quel que soit le cas réel */}
      {state.success && (
        <p
          role="status"
          className="rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-400"
        >
          {state.success}
        </p>
      )}
      {state.error && <AuthError>{state.error}</AuthError>}

      <AuthSubmit pending={isPending}>
        {isPending ? "Envoi…" : "Recevoir le lien"}
      </AuthSubmit>
    </form>
  );
}
