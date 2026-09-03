/**
 * File de relecture des contributions (/contributions/relecture).
 *
 * Réservée aux modérateurs et administrateurs (`contribution:moderate`).
 * Le droit de REJET terminal est calculé ici, côté serveur, et transmis à
 * la file : l'interface n'affiche pas une action que l'API refuserait.
 * Le serveur reste l'autorité — la route PATCH revérifie le rôle.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/rbac/page";
import { ReviewQueue } from "@/components/contributions/reviewQueue";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { getTranslations } from "@/lib/i18n/server";
import { rich } from "@/lib/i18n/rich";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t.contributions.reviewTitle,
    description: t.meta.reviewDescription,
    robots: { index: false, follow: false },
  };
}

export default async function ReviewPage() {
  const { t } = await getTranslations();
  const session = await requirePagePermission(
    "contribution",
    "moderate",
    "/contributions/relecture",
  );

  if (!session) {
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <h1 className="metal-title text-3xl">{t.auth.review}</h1>
        <AccessNotice
          title={t.contributions.moderatorRequired}
          description={t.contributions.moderatorRequiredNotice}
        />
      </section>
    );
  }

  return (
    <section className="flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="metal-title text-3xl">{t.auth.review}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {rich(t.contributions.reviewLead, {
            link: (
              <Link href="/about" className="hover:text-foreground underline">
                {t.contributions.reviewLeadLink}
              </Link>
            ),
          })}
        </p>
      </header>

      {/* Le rejet terminal est réservé aux admins (la route le revérifie) */}
      <ReviewQueue canReject={session.role === "admin"} />
    </section>
  );
}
