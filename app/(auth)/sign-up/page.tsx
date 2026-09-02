/**
 * Page d'inscription — formulaire sécurisé avec générateur de mot de
 * passe (Web Crypto), jauge zxcvbn et CAPTCHA Turnstile.
 * La validation serveur est portée par signUpAction (lib/actions/auth.ts).
 */

import Link from "next/link";
import { SignUpForm } from "@/components/auth/signUpForm";
import { AuthHeading } from "@/components/auth/authHeading";

export const metadata = { robots: { index: false }, title: "Inscription" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        title="Créer un compte"
        subtitle="Une contribution vaut par ses sources : chaque fiche proposée demande des preuves vérifiables."
      />

      <SignUpForm />

      <div className="border-border/60 border-t pt-4 text-sm">
        <p className="text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link
            href="/sign-in"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </>
  );
}
