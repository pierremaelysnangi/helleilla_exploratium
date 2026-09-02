/**
 * Page /forgot-password — demande de lien de réinitialisation.
 * La réponse est identique que le compte existe ou non (anti-énumération) :
 * la décision d'envoi appartient entièrement au serveur.
 */

import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgotPasswordForm";

export const metadata = {
  robots: { index: false },
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="metal-title text-2xl">Mot de passe oublié</h1>
      <div className="metal-rule mt-2 w-40" />
      <p className="text-muted-foreground mt-4 text-sm">
        Indiquez votre email : si un compte existe, vous recevrez un lien
        valable une heure pour définir un nouveau mot de passe.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/sign-in" className="metal-nav-link underline">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
