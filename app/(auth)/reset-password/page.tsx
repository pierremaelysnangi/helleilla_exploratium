/**
 * Page /reset-password — définition du nouveau mot de passe.
 * Le token provient de l'URL signée reçue par email (?token=…).
 * Sans token : invite à refaire une demande (pas d'erreur technique).
 */

import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/resetPasswordForm";
import { AuthHeading } from "@/components/auth/authHeading";

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
      <AuthHeading
        title="Nouveau mot de passe"
        subtitle="Choisissez un mot de passe long : le générateur en produit un valide."
      />

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-muted-foreground text-sm">
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
