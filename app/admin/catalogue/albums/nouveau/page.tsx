/**
 * Création d'une sortie (/admin/catalogue/albums/nouveau?bandId=…).
 *
 * Le groupe arrive par la query et n'est PAS choisi dans le formulaire :
 * on vient de sa fiche d'édition, où l'on voyait déjà sa discographie.
 * Un sélecteur de groupe ici aurait redemandé une information qu'on
 * tenait, et ouvert la porte à créer un album sous le mauvais nom.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/rbac/page";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { AlbumForm } from "@/components/admin/catalogue/albumForm";
import { getBandById } from "@/db/queries/bands";
import { getTranslations } from "@/lib/i18n/server";

type Props = { searchParams: Promise<{ bandId?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.admin.newAlbum, robots: { index: false, follow: false } };
}

export default async function NewAlbumPage({ searchParams }: Props) {
  const { t } = await getTranslations();
  const { bandId } = await searchParams;

  const session = await requirePagePermission(
    "album",
    "moderate",
    "/admin/catalogue",
  );
  if (!session) {
    return (
      <AccessNotice
        title={t.contributions.moderatorRequired}
        description={t.admin.catalogueAccessNotice}
      />
    );
  }

  // Sans groupe valide, il n'y a rien à créer : une sortie n'existe pas
  // hors de la discographie de quelqu'un.
  const band = bandId ? await getBandById(bandId) : null;
  if (!band) notFound();

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/admin", label: t.admin.title },
          { href: "/admin/catalogue", label: t.admin.catalogueEditor },
          { href: `/admin/catalogue/groupes/${band.id}`, label: band.name },
          { label: t.admin.newAlbum },
        ]}
      />

      <header>
        <h1 className="metal-title text-3xl">{t.admin.newAlbum}</h1>
        <div className="metal-rule mt-2 w-48" />
      </header>

      <AlbumForm bandId={band.id} />
    </section>
  );
}
