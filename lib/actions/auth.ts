"use server";

/**
 * Server Actions d'authentification (inscription / connexion / déconnexion).
 *
 * Chaîne de sécurité appliquée AVANT Better Auth :
 * 1. validation zod des entrées (longueur, format) ;
 * 2. vérification du CAPTCHA Turnstile côté serveur (siteverify) ;
 * 3. liste noire des mots de passe fuités.
 * Puis délégation à `auth.api.*` : Argon2id, cookies httpOnly/secure,
 * CSRF (plugin nextCookies), rate limiting Redis, anti-énumération
 * (messages d'erreur volontairement génériques).
 */

// Actions serveur Next.js — mutation de cookies autorisée ici
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
// Instance Better Auth serveur
import { auth } from "@/lib/auth";
// Barrières pré-authentification
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { isPasswordDenylisted } from "@/lib/auth/password-policy";
import { getTranslations } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/format";

/** État retourné aux formulaires client (useActionState). */
export type AuthFormState = { error?: string };

/** Schéma commun email/mot de passe. */
/** Longueur minimale du mot de passe, alignée sur `<PasswordField>`. */
const MIN_PASSWORD_LENGTH = 12;

// Les messages zod ne sont jamais rendus tels quels : l'action renvoie
// un message unique et traduit, volontairement peu bavard.
const credentialsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(128),
});

/**
 * Extrait l'IP du client depuis les en-têtes proxy usuels (même
 * convention que lib/api/rate-limit.ts).
 */
async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined
  );
}

/**
 * Action d'INSCRIPTION.
 * Retourne `{ error }` avec un message générique en cas d'échec ;
 * redirige vers la page d'accueil après succès (cookie de session posé
 * automatiquement par le plugin nextCookies de Better Auth).
 */
export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // 1. Validation structurelle
  const parsed = credentialsSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const { t } = await getTranslations();

  if (!parsed.success) {
    return {
      error: interpolate(t.errors.formInvalid, { min: MIN_PASSWORD_LENGTH }),
    };
  }

  // 2. CAPTCHA invisible (fail-closed si configuré)
  const captchaOk = await verifyTurnstileToken(
    formData.get("cf-turnstile-response") as string | null,
    await clientIp(),
  );
  if (!captchaOk) {
    return { error: t.errors.captchaFailed };
  }

  // 3. Liste noire des mots de passe fuités
  if (isPasswordDenylisted(parsed.data.password)) {
    return { error: t.errors.passwordLeaked };
  }

  // 4. Délégation à Better Auth (Argon2id + session)
  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch (err) {
    // Message générique : ne révèle jamais si un compte existe déjà
    console.warn(
      "[sign-up] Refusé :",
      err instanceof Error ? err.message : err,
    );
    return { error: t.errors.signUpRefused };
  }

  redirect("/");
}

/** Schéma de connexion (sans nom). */
const signInSchema = credentialsSchema.omit({ name: true });

/**
 * Action de CONNEXION.
 * Message d'erreur unique pour email inconnu et mot de passe erroné
 * (anti-énumération), rate limiting Better Auth en amont (5/5 min/IP).
 */
export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const { t } = await getTranslations();
  if (!parsed.success) {
    return { error: t.errors.badCredentials };
  }

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    // Générique volontairement : pas de distinction compte inexistant /
    // mauvais mot de passe (anti-énumération)
    return { error: t.errors.badCredentials };
  }

  redirect("/");
}

/**
 * Action de DÉCONNEXION : révoque la session côté serveur et purge le
 * cookie via le plugin nextCookies.
 */
export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
