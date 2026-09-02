"use server";

/**
 * Server Actions de réinitialisation de mot de passe.
 *
 * Sécurité :
 * - messages VOLONTAIREMENT génériques : impossible de distinguer un
 *   email inconnu d'un envoi réussi (anti-énumération de comptes) ;
 * - Turnstile vérifié côté serveur sur la demande de reset ;
 * - liste noire + longueur minimale appliquées au nouveau mot de passe ;
 * - le token est signé et à durée limitée par Better Auth (1 h).
 */

// Actions serveur Next.js — mutation de cookies autorisée ici
import "server-only";
import { headers } from "next/headers";
import { z } from "zod";
// Instance Better Auth serveur
import { auth } from "@/lib/auth";
// Barrières pré-validation
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { isPasswordDenylisted } from "@/lib/auth/password-policy";

/** État retourné aux formulaires clients. */
export type ResetFormState = { error?: string; success?: string };

/** Schéma de la demande de réinitialisation. */
const requestSchema = z.object({
  email: z.string().trim().email().max(200),
});

/**
 * Action DEMANDE DE RÉINITIALISATION (/forgot-password).
 * Répond toujours le même message, qu'un compte existe ou non.
 */
export async function requestPasswordResetAction(
  _prevState: ResetFormState,
  formData: FormData,
): Promise<ResetFormState> {
  const parsed = requestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    // Message identique au succès : aucune information exploitable
    return { success: "Si un compte existe, un email a été envoyé." };
  }

  // CAPTCHA invisible (fail-closed si configuré)
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined;
  const captchaOk = await verifyTurnstileToken(
    formData.get("cf-turnstile-response") as string | null,
    ip,
  );
  if (!captchaOk) {
    return { error: "Vérification anti-robot échouée, réessayez" };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`,
      },
      headers: h,
    });
  } catch (err) {
    // Journalisé mais jamais exposé à l'utilisateur
    console.warn("[forgot-password]", err instanceof Error ? err.message : err);
  }

  return { success: "Si un compte existe, un email a été envoyé." };
}

/** Schéma du nouveau mot de passe (aligné sur l'inscription). */
const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(12).max(128),
});

/**
 * Action NOUVEAU MOT DE PASSE (/reset-password?token=…).
 * Le token provient du lien email signé par Better Auth.
 */
export async function resetPasswordAction(
  _prevState: ResetFormState,
  formData: FormData,
): Promise<ResetFormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Mot de passe invalide (12 caractères minimum)" };
  }

  if (isPasswordDenylisted(parsed.data.password)) {
    return {
      error:
        "Ce mot de passe figure dans des fuites connues, choisissez-en un autre",
    };
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password, token: parsed.data.token },
      headers: await headers(),
    });
  } catch {
    // Token expiré/invalide : message unique, pas de détail technique
    return { error: "Lien invalide ou expiré — refaites une demande" };
  }

  return { success: "Mot de passe mis à jour. Vous pouvez vous connecter." };
}
