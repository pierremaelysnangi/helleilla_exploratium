/**
 * Création d'un groupe (/admin/catalogue/groupes/nouveau).
 *
 * Écran séparé de l'édition, et non un `[id]` valant « nouveau » : la
 * création n'a ni genres ni discographie à montrer, et un formulaire
 * qui affiche des sections vides sur un objet inexistant se lit mal.
 */

import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/rbac/page";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { BandForm } from "@/components/admin/catalogue/bandForm";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.admin.newBand, robots: { index: false, follow: false } };
}

export default async function NewBandPage() {
  const { t } = await getTranslations();
  const session = await requirePagePermission(
    "band",
    "moderate",
    "/admin/catalogue/groupes/nouveau",
  );

  if (!session) {
    return (
      <AccessNotice
        title={t.contributions.moderatorRequired}
        description={t.admin.catalogueAccessNotice}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/admin", label: t.admin.title },
          { href: "/admin/catalogue", label: t.admin.catalogueEditor },
          { label: t.admin.newBand },
        ]}
      />

      <header>
        <h1 className="metal-title text-3xl">{t.admin.newBand}</h1>
        <div className="metal-rule mt-2 w-48" />
      </header>

      <BandForm />
    </section>
  );
}
