/**
 * Page de soumission d'une contribution (/contributions) — Server Component.
 *
 * Réservée aux contributeurs et plus (`contribution:create`). Un simple
 * utilisateur connecté n'est pas redirigé mais informé : le rôle
 * contributeur s'obtient auprès d'un administrateur, une redirection vers
 * la connexion ne lui servirait à rien.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/rbac/page";
import { ContributionForm } from "@/components/contributions/contributionForm";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { getTranslations } from "@/lib/i18n/server";
import { rich } from "@/lib/i18n/rich";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t.contributions.proposeBand,
    description: t.meta.contributeDescription,
    // Page d'action derrière authentification : sans intérêt pour le crawl
    robots: { index: false, follow: true },
  };
}

export default async function ContributionsPage() {
  const { t } = await getTranslations();
  const session = await requirePagePermission(
    "contribution",
    "create",
    "/contributions",
  );

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="metal-title text-3xl">{t.contributions.proposeBand}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {rich(t.contributions.submitLead, {
            link: (
              <Link href="/about" className="hover:text-foreground underline">
                {t.contributions.whyRequired}
              </Link>
            ),
          })}
        </p>
      </header>

      {session ? (
        <ContributionForm />
      ) : (
        <AccessNotice
          title={t.contributions.contributorRequired}
          description={t.contributions.contributorRequiredNotice}
        />
      )}
    </section>
  );
}
