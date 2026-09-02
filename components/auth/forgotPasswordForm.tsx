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

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ResetFormState,
    FormData
  >(requestPasswordResetAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label htmlFor="email">Email du compte</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        maxLength={200}
        autoComplete="email"
        className="border-border bg-card focus:border-primary/50 rounded-md border px-3 py-2 text-sm outline-none"
      />

      <TurnstileWidget />

      {/* Succès ET erreur anti-énumération : mêmes messages quel que soit le cas réel */}
      {state.success && (
        <p role="status" className="text-sm text-green-600">
          {state.success}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}
