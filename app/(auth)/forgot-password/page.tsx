/**
 * Page /forgot-password — demande de lien de réinitialisation.
 * La réponse est identique que le compte existe ou non (anti-énumération) :
 * la décision d'envoi appartient entièrement au serveur.
 */

import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgotPasswordForm";
import { AuthHeading } from "@/components/auth/authHeading";
import { getTranslations } from "@/lib/i18n/server";

export const metadata = {
  robots: { index: false },
  title: "Mot de passe oublié",
};

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
