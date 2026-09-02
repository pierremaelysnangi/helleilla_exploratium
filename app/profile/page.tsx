/**
 * Page profil et préférences (/profile) — Server Component.
 *
 * Accessible à tout utilisateur connecté. Elle réunit deux choses de
 * nature différente, et le dit explicitement : le profil public (donnée
 * serveur, visible des autres) et les préférences de lecture (locales à
 * l'appareil, jamais transmises).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requirePageSession } from "@/lib/rbac/page";
import { ProfileForm } from "@/components/profile/profileForm";
import { roleLabel } from "@/components/admin/roleBadge";
import type { UserRole } from "@/hooks/api/schemas";

export const metadata: Metadata = {
  title: "Mon profil",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await requirePageSession("/profile");

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl">Mon profil</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          Rôle actuel : {roleLabel(session.role as UserRole)}.{" "}
          {session.role === "user" ? (
            <>
              Le rôle contributeur, nécessaire pour proposer un groupe,
              s&apos;obtient auprès d&apos;un administrateur.
            </>
          ) : (
            <Link
              href="/contributions/mes-dossiers"
              className="hover:text-foreground underline"
            >
              Voir mes dossiers
            </Link>
          )}
        </p>
      </header>

      <ProfileForm />
    </section>
  );
}
