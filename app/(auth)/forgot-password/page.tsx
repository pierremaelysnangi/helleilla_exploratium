/**
 * Page /forgot-password — demande de lien de réinitialisation.
 * La réponse est identique que le compte existe ou non (anti-énumération) :
 * la décision d'envoi appartient entièrement au serveur.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgotPasswordForm";
import { AuthHeading } from "@/components/auth/authHeading";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { robots: { index: false }, title: t.account.forgotTitle };
}

export default async function ForgotPasswordPage() {
  const { t } = await getTranslations();
  return (
    <>
      <AuthHeading
        title={t.account.forgotTitle}
        subtitle={t.account.forgotSubtitle}
      />

      <ForgotPasswordForm />

      <p className="border-border/60 border-t pt-4 text-sm">
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          {t.account.backToSignIn}
        </Link>
      </p>
    </>
  );
}
