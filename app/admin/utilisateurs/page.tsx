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
import Link from "next/link";
import { requirePagePermission } from "@/lib/rbac/page";
import { UsersTable } from "@/components/admin/usersTable";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { getTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Comptes",
  robots: { index: false, follow: false },
};

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
        <h1 className="metal-title text-3xl">Comptes</h1>
        <AccessNotice
          title={t.app.adminRequired}
          description="La gestion des comptes est réservée aux administrateurs."
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label="Fil d'Ariane" className="text-muted-foreground text-sm">
        <Link href="/admin" className="hover:text-foreground">
          Administration
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Comptes</span>
      </nav>

      <header>
        <h1 className="metal-title text-3xl">Comptes</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Le rôle contributeur s&apos;attribue ici : c&apos;est la seule voie,
          l&apos;inscription ne le donne pas. Le dernier administrateur ne peut
          être ni rétrogradé ni supprimé.
        </p>
      </header>

      <UsersTable currentUserId={session.userId} />
    </section>
  );
}
