"use client";

/**
 * <ResetPasswordForm> — nouveau mot de passe après clic sur le lien email.
 * Le token (fourni par la page serveur depuis ?token=…) transite en champ
 * caché ; la politique de force est identique à l'inscription.
 */

// Server Action + générateur/jauge réutilisés
import {
  resetPasswordAction,
  type ResetFormState,
} from "@/lib/actions/password-reset";
import { useActionState, useState } from "react";
import {
  PasswordField,
  passwordMeetsPolicy,
} from "@/components/auth/passwordField";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import { useT } from "@/lib/i18n/client";

type ResetPasswordFormProps = {
  /** Token signé Better Auth extrait de l'URL du lien email. */
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useT();
  const [state, formAction, isPending] = useActionState<
    ResetFormState,
    FormData
  >(resetPasswordAction, {});
  const [password, setPassword] = useState("");
  const strength = usePasswordStrength(password);
  const policyOk = passwordMeetsPolicy(password, strength?.score ?? null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Token signé du lien email */}
      <input type="hidden" name="token" value={token} />

      <PasswordField
        value={password}
        onChange={setPassword}
        label={t.account.newPassword}
      />

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state.success && (
        <>
          <p role="status" className="text-sm text-green-600">
            {state.success}
          </p>
          <a href="/sign-in" className="metal-nav-link text-sm underline">
            {t.app.goToSignIn}
          </a>
        </>
      )}

      {!state.success && (
        <>
          <button
            type="submit"
            disabled={isPending || !policyOk}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? t.account.updating : t.account.setPassword}
          </button>
        </>
      )}
    </form>
  );
}
