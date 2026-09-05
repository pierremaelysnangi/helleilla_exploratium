/**
 * Édition d'un groupe (/admin/catalogue/groupes/[id]).
 *
 * Trois blocs, dans l'ordre où l'on corrige : la fiche elle-même, les
 * genres qui la classent, puis la discographie. Le lien vers la fiche
 * publique est en tête — vérifier le rendu réel est le premier réflexe
 * après une correction.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/rbac/page";
import { AccessNotice } from "@/components/contributions/accessNotice";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { BandForm } from "@/components/admin/catalogue/bandForm";
import { BandGenresField } from "@/components/admin/catalogue/bandGenresField";
import { DeleteBand } from "@/components/admin/catalogue/deleteBand";
import { getBandById } from "@/db/queries/bands";
import { listGenresByBandId } from "@/db/queries/genres";
import { fetchDiscography } from "@/lib/api/discography";
import type { AlbumRow } from "@/hooks/api/schemas";
import { getTranslations } from "@/lib/i18n/server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const band = await getBandById(id);
  return {
    title: band?.name ?? "",
    robots: { index: false, follow: false },
  };
}

export default async function EditBandPage({ params }: Props) {
  const { t, n } = await getTranslations();
  const { id } = await params;

  const session = await requirePagePermission(
    "band",
    "moderate",
    `/admin/catalogue/groupes/${id}`,
  );
  if (!session) {
    return (
      <AccessNotice
        title={t.contributions.moderatorRequired}
        description={t.admin.catalogueAccessNotice}
      />
    );
  }

  const band = await getBandById(id);
  if (!band) notFound();

  const [genres, discography] = await Promise.all([
    listGenresByBandId(band.id),
    fetchDiscography(band.id) as Promise<AlbumRow[]>,
  ]);

  // Le formulaire est typé sur la ligne SÉRIALISÉE de l'API : les dates
  // sont converties ici plutôt que de laisser diverger le type selon la
  // provenance de la donnée.
  const row = {
    ...band,
    createdAt: band.createdAt.toISOString(),
    updatedAt: band.updatedAt.toISOString(),
  };

  return (
    <section className="flex flex-col gap-8">
      <Breadcrumb
        label={t.app.breadcrumb}
        items={[
          { href: "/admin", label: t.admin.title },
          { href: "/admin/catalogue", label: t.admin.catalogueEditor },
          { label: band.name },
        ]}
      />

      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="metal-title text-3xl">{band.name}</h1>
          <div className="metal-rule mt-2 w-48" />
        </div>
        <Link
          href={`/bands/${band.slug}`}
          className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
        >
          {t.admin.viewPublicPage}
        </Link>
      </header>

      <section aria-label={t.admin.bandFields} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.admin.bandFields}</h2>
        <BandForm band={row} />
      </section>

      <section aria-label={t.band.genres} className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">{t.band.genres}</h2>
        <BandGenresField bandId={band.id} current={genres} />
      </section>

      <section aria-label={t.band.discography} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="metal-title text-lg">{t.band.discography}</h2>
          <Link
            href={`/admin/catalogue/albums/nouveau?bandId=${band.id}`}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase hover:opacity-90"
          >
            {t.admin.newAlbum}
          </Link>
        </div>

        <p className="text-muted-foreground text-sm">
          {n(t.count.releases, discography.length)}
        </p>

        <ul className="flex flex-col gap-1">
          {discography.map((album) => (
            <li key={album.id}>
              <Link
                href={`/admin/catalogue/albums/${album.id}`}
                className="metal-card hover:bg-accent/30 flex flex-wrap items-center gap-3 px-4 py-2.5"
              >
                <span className="text-muted-foreground w-12 shrink-0 font-mono text-sm">
                  {album.releaseYear ?? t.band.unknownYear}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {album.title}
                </span>
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  {t.releaseType[album.type]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label={t.admin.dangerZone}
        className="border-border flex flex-col gap-3 border-t pt-6"
      >
        <h2 className="metal-title text-lg">{t.admin.dangerZone}</h2>
        <DeleteBand id={band.id} name={band.name} />
      </section>
    </section>
  );
}
