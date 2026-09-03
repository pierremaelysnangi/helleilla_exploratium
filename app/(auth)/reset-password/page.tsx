/**
 * Page /reset-password — définition du nouveau mot de passe.
 * Le token provient de l'URL signée reçue par email (?token=…).
 * Sans token : invite à refaire une demande (pas d'erreur technique).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/resetPasswordForm";
import { AuthHeading } from "@/components/auth/authHeading";
import { getTranslations } from "@/lib/i18n/server";
import { rich } from "@/lib/i18n/rich";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { robots: { index: false }, title: t.account.resetTitle };
}

/** Props App Router : searchParams est une promesse en Next 15+. */
type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { t } = await getTranslations();
  const { token } = await searchParams;

  return (
    <>
      <AuthHeading
        title={t.account.resetTitle}
        subtitle={t.account.resetSubtitle}
      />

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-muted-foreground text-sm">
          {rich(t.account.incompleteLink, {
            link: (
              <Link href="/forgot-password" className="underline">
                {t.account.askAgain}
              </Link>
            ),
          })}
        </p>
      )}
    </>
  );
}
