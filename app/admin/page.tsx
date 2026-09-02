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

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

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
  const session = await requirePagePermission("user", "read", "/admin");

  if (!session) {
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <h1 className="metal-title text-3xl">Administration</h1>
        <AccessNotice
          title="Rôle administrateur requis"
          description="Cet espace est réservé aux administrateurs. Les modérateurs disposent de la file de relecture des contributions."
        />
      </section>
    );
  }

  const stats = await getAdminStats();

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl">Administration</h1>
        <div className="metal-rule mt-2 w-48" />
      </header>

      <section aria-label="Chiffres clés" className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">Catalogue</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Groupes" value={stats.bands} />
          <StatTile label="Albums" value={stats.albums} />
          <StatTile label="Pistes" value={stats.tracks} />
          <StatTile label="Genres" value={stats.genres} />
        </div>
      </section>

      <section aria-label="Communauté" className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">Communauté</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Comptes" value={stats.users} />
          <StatTile label="Administrateurs" value={stats.admins} />
          <StatTile label="Dossiers à relire" value={stats.openContributions} />
        </div>
      </section>

      <nav aria-label="Actions" className="flex flex-wrap gap-2">
        <Link
          href="/admin/utilisateurs"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:opacity-90"
        >
          Gérer les comptes
        </Link>
        <Link
          href="/contributions/relecture"
          className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-sm font-semibold tracking-wide uppercase"
        >
          File de relecture
          {stats.openContributions > 0 && ` (${stats.openContributions})`}
        </Link>
        <Link
          href="/api/docs"
          className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-sm font-semibold tracking-wide uppercase"
        >
          Documentation API
        </Link>
      </nav>
    </section>
  );
}
