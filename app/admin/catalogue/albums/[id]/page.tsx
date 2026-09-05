/**
 * Édition d'une sortie (/admin/catalogue/albums/[id]).
 *
 * La fiche et sa tracklist sur le même écran : corriger un album, c'est
 * presque toujours corriger aussi une piste — un numéro décalé, une
 * durée absente. Les séparer aurait imposé un aller-retour pour chaque
 * correction.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/rbac/page";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { AlbumForm } from "@/components/admin/catalogue/albumForm";
import { TracklistEditor } from "@/components/admin/catalogue/tracklistEditor";
import { DeleteAlbum } from "@/components/admin/catalogue/deleteAlbum";
import { getAlbumById } from "@/db/queries/albums";
import { getBandById } from "@/db/queries/bands";
import { getTranslations } from "@/lib/i18n/server";
import type { AlbumRow } from "@/hooks/api/schemas";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getAlbumById(id);
  return {
    title: album?.title ?? "",
    robots: { index: false, follow: false },
  };
}

export default async function EditAlbumPage({ params }: Props) {
  const { t } = await getTranslations();
  const { id } = await params;

  const session = await requirePagePermission(
    "album",
    "moderate",
    `/admin/catalogue/albums/${id}`,
  );
  if (!session) {
    return (
      <AccessNotice
        title={t.contributions.moderatorRequired}
        description={t.admin.catalogueAccessNotice}
      />
    );
  }

  const album = await getAlbumById(id);
  if (!album) notFound();

  const band = await getBandById(album.bandId);
  if (!band) notFound();

  const row = {
    ...album,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
  } as AlbumRow;

  return (
    <section className="flex flex-col gap-8">
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/admin", label: t.admin.title },
          { href: "/admin/catalogue", label: t.admin.catalogueEditor },
          { href: `/admin/catalogue/groupes/${band.id}`, label: band.name },
          { label: album.title },
        ]}
      />

      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="metal-title text-3xl">{album.title}</h1>
          <div className="metal-rule mt-2 w-48" />
        </div>
        <Link
          href={`/bands/${band.slug}/albums/${album.slug}`}
          className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
        >
          {t.admin.viewPublicPage}
        </Link>
      </header>

      <section aria-label={t.admin.albumFields} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.admin.albumFields}</h2>
        <AlbumForm bandId={band.id} album={row} />
      </section>

      <section aria-label={t.album.tracklist} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.album.tracklist}</h2>
        <TracklistEditor albumId={album.id} />
      </section>

      <section
        aria-label={t.admin.dangerZone}
        className="border-border flex flex-col gap-3 border-t pt-6"
      >
        <h2 className="metal-title text-lg">{t.admin.dangerZone}</h2>
        <DeleteAlbum id={album.id} title={album.title} bandId={band.id} />
      </section>
    </section>
  );
}
