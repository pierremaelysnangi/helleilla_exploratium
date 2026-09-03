/**
 * Page de connexion — Better Auth (Argon2id, cookies httpOnly,
 * anti-énumération, rate limiting Redis 5 essais/5 min/IP).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/signInForm";
import { AuthHeading } from "@/components/auth/authHeading";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { robots: { index: false }, title: t.auth.signIn };
}

export default async function SignInPage() {
  const { t } = await getTranslations();
  return (
    <>
      <AuthHeading title={t.auth.signIn} subtitle={t.account.signInSubtitle} />

      <SignInForm />

      <div className="border-border/60 flex flex-col gap-2 border-t pt-4 text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          {t.account.forgotLink}
        </Link>
        <p className="text-muted-foreground">
          {t.account.noAccount}{" "}
          <Link
            href="/sign-up"
            className="text-foreground font-medium underline underline-offset-4"
          >
            {t.auth.signUp}
          </Link>
        </p>
      </div>
    </>
  );
}
