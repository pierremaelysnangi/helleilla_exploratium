/**
 * Page de connexion — Better Auth (Argon2id, cookies httpOnly,
 * anti-énumération, rate limiting Redis 5 essais/5 min/IP).
 */

import Link from "next/link";
import { SignInForm } from "@/components/auth/signInForm";
import { AuthHeading } from "@/components/auth/authHeading";

export const metadata = { robots: { index: false }, title: "Connexion" };

export default function SignInPage() {
  return (
    <>
      <AuthHeading
        title="Se connecter"
        subtitle="Pour contribuer, noter les albums et tenir votre liste."
      />

      <SignInForm />

      <div className="border-border/60 flex flex-col gap-2 border-t pt-4 text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Mot de passe oublié ?
        </Link>
        <p className="text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/sign-up"
            className="text-foreground font-medium underline underline-offset-4"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </>
  );
}
