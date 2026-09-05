/**
 * Catalogue — écran d'édition (/admin/catalogue).
 *
 * Réservé à `band:moderate`, donc aux modérateurs et aux
 * administrateurs. Ce n'est PAS une restriction arbitraire : la matrice
 * accorde bien `band:create` dès le rôle contributeur, mais un
 * contributeur passe par le dossier à preuves, qui est toute la raison
 * d'être du workflow. Lui ouvrir un formulaire d'écriture directe
 * contournerait le dispositif qu'on a construit pour lui.
 *
 * L'édition directe est donc un outil de MODÉRATION : corriger une
 * donnée fausse, compléter une sortie, retirer un doublon.
 */

import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/rbac/page";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { CatalogueBandPicker } from "@/components/admin/catalogue/catalogueBandPicker";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t.admin.catalogueEditor,
    robots: { index: false, follow: false },
  };
}

export default async function CataloguePage() {
  const { t } = await getTranslations();
  const session = await requirePagePermission(
    "band",
    "moderate",
    "/admin/catalogue",
  );

  if (!session) {
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <h1 className="metal-title text-3xl">{t.admin.catalogueEditor}</h1>
        <AccessNotice
          title={t.contributions.moderatorRequired}
          description={t.admin.catalogueAccessNotice}
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/admin", label: t.admin.title },
          { label: t.admin.catalogueEditor },
        ]}
      />

      <header>
        <h1 className="metal-title text-3xl">{t.admin.catalogueEditor}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          {t.admin.catalogueLead}
        </p>
      </header>

      <CatalogueBandPicker />
    </section>
  );
}
