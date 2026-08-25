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

/** État retourné aux formulaires client (useActionState). */
export type AuthFormState = { error?: string };

/** Schéma commun email/mot de passe. */
const credentialsSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(200),
  password: z.string().min(12).max(128),
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
  if (!parsed.success) {
    return {
      error: "Formulaire invalide (12 caractères minimum pour le mot de passe)",
    };
  }

  // 2. CAPTCHA invisible (fail-closed si configuré)
  const captchaOk = await verifyTurnstileToken(
    formData.get("cf-turnstile-response") as string | null,
    await clientIp(),
  );
  if (!captchaOk) {
    return { error: "Vérification anti-robot échouée, réessayez" };
  }

  // 3. Liste noire des mots de passe fuités
  if (isPasswordDenylisted(parsed.data.password)) {
    return {
      error:
        "Ce mot de passe figure dans des fuites connues, choisissez-en un autre",
    };
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
    return { error: "Inscription impossible avec ces informations" };
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
  if (!parsed.success) {
    return { error: "Email ou mot de passe incorrect" };
  }

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    // Générique volontairement : pas de distinction compte inexistant /
    // mauvais mot de passe (anti-énumération)
    return { error: "Email ou mot de passe incorrect" };
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
