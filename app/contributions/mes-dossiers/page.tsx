/**
 * Suivi des dossiers soumis (/contributions/mes-dossiers).
 *
 * Accessible à tout utilisateur connecté : la matrice accorde
 * `contribution:read` dès le rôle `user`, précisément pour qu'un compte
 * ayant perdu le rôle contributeur puisse encore suivre ses dossiers en
 * cours.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { requirePageSession } from "@/lib/rbac/page";
import { MyContributions } from "@/components/contributions/myContributions";

export const metadata: Metadata = {
  title: "Mes dossiers",
  description: "Suivi de vos contributions à l'encyclopédie.",
  robots: { index: false, follow: true },
};

export default async function MyContributionsPage() {
  await requirePageSession("/contributions/mes-dossiers");

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="metal-title text-3xl">Mes dossiers</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          Suivez l&apos;avancement de vos contributions et répondez aux demandes
          de preuves.{" "}
          <Link
            href="/contributions"
            className="hover:text-foreground underline"
          >
            Proposer un groupe
          </Link>
          .
        </p>
      </header>

      <MyContributions />
    </section>
  );
}
