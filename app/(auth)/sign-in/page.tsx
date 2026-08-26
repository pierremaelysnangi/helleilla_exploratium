/**
 * Page de connexion — Better Auth (Argon2id, cookies httpOnly,
 * anti-énumération, rate limiting Redis 5 essais/5 min/IP).
 */

import Link from "next/link";
// Formulaire client
import { SignInForm } from "@/components/auth/signInForm";

export const metadata = { robots: { index: false }, title: "Connexion" };

export default function SignInPage() {
  return (
    <>
      <h1>Se connecter</h1>
      <SignInForm />
      <p className="text-sm">
        <Link href="/forgot-password" className="metal-nav-link underline">
          Mot de passe oublié ?
        </Link>
      </p>
      <p className="text-sm">
        Pas encore de compte ? <Link href="/sign-up">S&apos;inscrire</Link>
      </p>
    </>
  );
}
