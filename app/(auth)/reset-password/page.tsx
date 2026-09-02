/**
 * Page /reset-password — définition du nouveau mot de passe.
 * Le token provient de l'URL signée reçue par email (?token=…).
 * Sans token : invite à refaire une demande (pas d'erreur technique).
 */

import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/resetPasswordForm";

export const metadata = {
  robots: { index: false },
  title: "Nouveau mot de passe",
};

/** Props App Router : searchParams est une promesse en Next 15+. */
type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <>
      <h1 className="metal-title text-2xl">Nouveau mot de passe</h1>
      <div className="metal-rule mt-2 w-40" />

      {token ? (
        <div className="mt-6">
          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          Lien incomplet.{" "}
          <Link href="/forgot-password" className="underline">
            Refaites une demande
          </Link>{" "}
          pour recevoir un nouveau lien.
        </p>
      )}
    </>
  );
}
