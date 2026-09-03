/**
 * Page d'inscription — formulaire sécurisé avec générateur de mot de
 * passe (Web Crypto), jauge zxcvbn et CAPTCHA Turnstile.
 * La validation serveur est portée par signUpAction (lib/actions/auth.ts).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/signUpForm";
import { AuthHeading } from "@/components/auth/authHeading";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { robots: { index: false }, title: t.auth.signUp };
}

export default async function SignUpPage() {
  const { t } = await getTranslations();
  return (
    <>
      <AuthHeading
        title={t.account.signUpTitle}
        subtitle={t.account.signUpSubtitle}
      />

      <SignUpForm />

      <div className="border-border/60 border-t pt-4 text-sm">
        <p className="text-muted-foreground">
          {t.account.alreadyRegistered}{" "}
          <Link
            href="/sign-in"
            className="text-foreground font-medium underline underline-offset-4"
          >
            {t.auth.signIn}
          </Link>
        </p>
      </div>
    </>
  );
}
