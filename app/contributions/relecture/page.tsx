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

export const metadata: Metadata = {
  title: "Relecture des contributions",
  description: "File de modération des dossiers soumis.",
  robots: { index: false, follow: false },
};

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
        <h1 className="metal-title text-3xl">Relecture</h1>
        <AccessNotice
          title={t.contributions.moderatorRequired}
          description="La file de relecture est réservée aux modérateurs et aux administrateurs. Si vous avez soumis un dossier, vous pouvez en suivre l'avancement depuis vos dossiers."
        />
      </section>
    );
  }

  return (
    <section className="flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="metal-title text-3xl">Relecture</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Vérifiez les sources avant d&apos;approuver : l&apos;approbation crée
          réellement la fiche du groupe. En cas de doute, demandez des preuves
          plutôt que de rejeter —{" "}
          <Link href="/about" className="hover:text-foreground underline">
            le workflow privilégie le dialogue
          </Link>
          .
        </p>
      </header>

      {/* Le rejet terminal est réservé aux admins (la route le revérifie) */}
      <ReviewQueue canReject={session.role === "admin"} />
    </section>
  );
}
