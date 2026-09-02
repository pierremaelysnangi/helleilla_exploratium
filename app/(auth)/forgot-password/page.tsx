/**
 * Page /forgot-password — demande de lien de réinitialisation.
 * La réponse est identique que le compte existe ou non (anti-énumération) :
 * la décision d'envoi appartient entièrement au serveur.
 */

import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgotPasswordForm";
import { AuthHeading } from "@/components/auth/authHeading";

export const metadata = {
  robots: { index: false },
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Mot de passe oublié"
        subtitle="Indiquez votre adresse : si un compte existe, vous recevrez un lien valable une heure."
      />

      <ForgotPasswordForm />

      <p className="border-border/60 border-t pt-4 text-sm">
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
