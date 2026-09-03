/**
 * Gestion des comptes (/admin/utilisateurs) — Server Component.
 *
 * L'identifiant de l'administrateur connecté est résolu ici et transmis à
 * la table : elle s'en sert pour masquer ses propres actions destructrices,
 * que l'API refuse de toute façon (auto-rétrogradation, auto-bannissement,
 * auto-suppression). Le serveur reste l'autorité, l'interface évite
 * seulement de proposer une action vouée à l'échec.
 */

import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/rbac/page";
import { UsersTable } from "@/components/admin/usersTable";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.admin.accounts, robots: { index: false, follow: false } };
}

export default async function AdminUsersPage() {
  const { t } = await getTranslations();
  const session = await requirePagePermission(
    "user",
    "read",
    "/admin/utilisateurs",
  );

  if (!session) {
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <h1 className="metal-title text-3xl">{t.admin.accounts}</h1>
        <AccessNotice
          title={t.app.adminRequired}
          description={t.admin.accountsAccessNotice}
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
          { label: t.admin.accounts },
        ]}
      />

      <header>
        <h1 className="metal-title text-3xl">{t.admin.accounts}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t.admin.accountsLead}
        </p>
      </header>

      <UsersTable currentUserId={session.userId} />
    </section>
  );
}
