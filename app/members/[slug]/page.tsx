/**
 * Fiche d'un membre (/members/[slug]) — Server Component.
 *
 * Cette route avait été SUPPRIMÉE en phase B : sans table `members`, elle
 * répondait 200 « en construction » à n'importe quelle chaîne, ce qui est
 * pire qu'une absence de route. Elle revient maintenant qu'un modèle de
 * données existe réellement derrière.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getMemberBySlug } from "@/db/queries/members";
import { EmptyState } from "@/components/shared/emptyState";

type MemberPageProps = {
  params: Promise<{ slug: string }>;
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Formate une période d'activité (« 1991 – 2001 » ou « 1991 – … »). */
function period(joinedYear: number | null, leftYear: number | null): string {
  if (!joinedYear && !leftYear) return "période inconnue";
  return `${joinedYear ?? "?"} – ${leftYear ?? "…"}`;
}

export async function generateMetadata({
  params,
}: MemberPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) return { title: "Membre introuvable", robots: { index: false } };

  const bandNames = member.bands.map((b) => b.name).join(", ");
  const description = bandNames
    ? `${member.name} : ${bandNames}.`
    : `${member.name} dans l'encyclopédie Helleilla Exploratium.`;

  return {
    title: member.name,
    description,
    alternates: { canonical: `/members/${member.slug}` },
    openGraph: {
      type: "profile",
      title: member.name,
      description,
      url: `${BASE_URL}/members/${member.slug}`,
    },
  };
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);

  if (!member) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    url: `${BASE_URL}/members/${member.slug}`,
    ...(member.bio ? { description: member.bio.slice(0, 500) } : {}),
    ...(member.bands.length > 0
      ? {
          memberOf: member.bands.map((b) => ({
            "@type": "MusicGroup",
            name: b.name,
            url: `${BASE_URL}/bands/${b.slug}`,
          })),
        }
      : {}),
  };

  return (
    <article className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">{member.name}</h1>
        <div className="metal-rule mt-2 w-48" />
        {member.bio && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed">{member.bio}</p>
        )}
        {member.musicbrainzId && (
          <p className="mt-3 text-xs">
            <a
              href={`https://musicbrainz.org/artist/${member.musicbrainzId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground underline"
            >
              Fiche MusicBrainz ↗
            </a>
          </p>
        )}
      </header>

      <section aria-label="Groupes" className="flex flex-col gap-3">
        <h2 className="metal-title text-lg">Groupes</h2>
        {member.bands.length === 0 ? (
          <EmptyState
            title="Aucun groupe référencé"
            description="Aucune appartenance n'a encore été documentée pour cette personne."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {member.bands.map((band) => (
              <li key={`${band.id}-${band.joinedYear ?? "x"}`}>
                <Link
                  href={`/bands/${band.slug}`}
                  className="metal-card hover:bg-accent/30 flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <span className="text-sm font-medium">{band.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {band.role ? `${band.role} · ` : ""}
                    {period(band.joinedYear, band.leftYear)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {member.albums.length > 0 && (
        <section aria-label="Albums" className="flex flex-col gap-3">
          <h2 className="metal-title text-lg">Présent sur</h2>
          <ul className="divide-border border-border divide-y rounded-lg border">
            {member.albums.map((album) => (
              <li key={album.id} className="bg-card">
                <Link
                  href={`/bands/${album.bandSlug}/albums/${album.slug}`}
                  className="hover:bg-accent/30 flex items-center gap-3 px-4 py-2.5"
                >
                  <span className="text-muted-foreground w-12 shrink-0 font-mono text-sm">
                    {album.releaseYear ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {album.title}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {album.bandName}
                    </span>
                  </span>
                  {album.role && (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {album.role}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
