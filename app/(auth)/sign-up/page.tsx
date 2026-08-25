/**
 * Page d'inscription — formulaire sécurisé avec générateur de mot de
 * passe (Web Crypto), jauge zxcvbn et CAPTCHA Turnstile.
 * La validation serveur est portée par signUpAction (lib/actions/auth.ts).
 */

import Link from "next/link";
// Formulaire client (générateur + jauge + Turnstile)
import { SignUpForm } from "@/components/auth/signUpForm";

export const metadata = { title: "Inscription" };

export default function SignUpPage() {
  return (
    <>
      <h1>Créer un compte</h1>
      <SignUpForm />
      <p>
        Déjà inscrit ? <Link href="/sign-in">Se connecter</Link>
      </p>
    </>
  );
}
