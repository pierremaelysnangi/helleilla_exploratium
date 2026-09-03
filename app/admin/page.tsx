/**
 * Tableau de bord d'administration (/admin) — Server Component.
 *
 * Réservé aux administrateurs (`user:read`, seule permission de la
 * matrice qu'aucun autre rôle ne possède). Les chiffres sont lus
 * directement en base : un appel HTTP à l'API depuis un composant serveur
 * ne transporterait pas le cookie de session.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/rbac/page";
import { getAdminStats } from "@/db/queries/stats";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.admin.title, robots: { index: false, follow: false } };
}

/** Une tuile de compteur. */
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="metal-card flex flex-col gap-1 p-4">
      <span className="metal-title text-2xl">{value}</span>
      <span className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

export default async function AdminPage() {
  const { t } = await getTranslations();
  const session = await requirePagePermission("user", "read", "/admin");

  if (!session) {
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <h1 className="metal-title text-3xl">{t.admin.title}</h1>
        <AccessNotice
          title={t.app.adminRequired}
          description={t.admin.accessNotice}
        />
      </section>
    );
  }

  const stats = await getAdminStats();

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl">{t.admin.title}</h1>
        <div className="metal-rule mt-2 w-48" />
      </header>

      <section aria-label={t.app.keyFigures} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.admin.catalogue}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={t.nav.bands} value={stats.bands} />
          <StatTile label={t.nav.albums} value={stats.albums} />
          <StatTile label={t.app.tracks} value={stats.tracks} />
          <StatTile label={t.nav.genres} value={stats.genres} />
        </div>
      </section>

      <section aria-label={t.app.community} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.app.community}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label={t.admin.accounts} value={stats.users} />
          <StatTile label={t.admin.administrators} value={stats.admins} />
          <StatTile
            label={t.admin.pendingSubmissions}
            value={stats.openContributions}
          />
        </div>
      </section>

      <nav aria-label={t.app.actions} className="flex flex-wrap gap-2">
        <Link
          href="/admin/utilisateurs"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:opacity-90"
        >
          {t.app.manageAccounts}
        </Link>
        <Link
          href="/contributions/relecture"
          className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-sm font-semibold tracking-wide uppercase"
        >
          {t.admin.reviewQueue}
          {stats.openContributions > 0 && ` (${stats.openContributions})`}
        </Link>
        <Link
          href="/api/docs"
          className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-sm font-semibold tracking-wide uppercase"
        >
          {t.admin.apiDocs}
        </Link>
      </nav>
    </section>
  );
}
