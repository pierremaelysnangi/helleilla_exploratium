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
import { getTranslations } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.profile.title, robots: { index: false, follow: false } };
}

export default async function ProfilePage() {
  const [session, { t }] = await Promise.all([
    requirePageSession("/profile"),
    getTranslations(),
  ]);

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl">{t.profile.title}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          {interpolate(t.profile.currentRole, {
            role: roleLabel(t, session.role as UserRole),
          })}{" "}
          {session.role === "user" ? (
            t.profile.contributorHint
          ) : (
            <Link
              href="/contributions/mes-dossiers"
              className="hover:text-foreground underline"
            >
              {t.contributions.mySubmissions}
            </Link>
          )}
        </p>
      </header>

      <ProfileForm />
    </section>
  );
}
