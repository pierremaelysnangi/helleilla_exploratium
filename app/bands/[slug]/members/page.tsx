/**
 * Membres d'un groupe (/bands/[slug]/members) — Server Component.
 *
 * Deux sources, dans cet ordre :
 *
 * 1. la formation PERSISTÉE (`band_members`), documentée et corrigeable
 *    localement — chaque membre a sa fiche interne ;
 * 2. à défaut, les membres lus à la volée depuis MusicBrainz, qui donnent
 *    au moins des noms mais ne sont ni indexables ni corrigeables.
 *
 * La page reste `noindex` tant qu'elle s'appuie sur le repli externe :
 * on n'indexe pas comme sien un contenu non maîtrisé.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
// Fetch serveur
import { fetchBandBySlug } from "@/hooks/use-bands";
import { fetchPublicOrNull } from "@/lib/api/client";
import { bandMediaSchema } from "@/hooks/api/schemas";
import { listMembersByBandId } from "@/db/queries/members";
import { EmptyState } from "@/components/shared/emptyState";

type MembersPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MembersPageProps): Promise<Metadata> {
  const { slug } = await params;
  const band = await fetchBandBySlug(slug);
  if (!band) return { title: "Groupe introuvable", robots: { index: false } };

  const documented = await listMembersByBandId(band.id);

  return {
    title: `Membres de ${band.name}`,
    description: documented.length
      ? `Formation de ${band.name} : ${documented.length} membre${documented.length > 1 ? "s" : ""} référencé${documented.length > 1 ? "s" : ""}.`
      : `Formation de ${band.name} d'après MusicBrainz.`,
    // Indexable seulement quand la formation est documentée chez nous ;
    // le repli MusicBrainz reste du contenu externe non maîtrisé.
    robots: { index: documented.length > 0, follow: true },
  };
}

export default async function BandMembersPage({ params }: MembersPageProps) {
  const { slug } = await params;
  const band = await fetchBandBySlug(slug);

  if (!band) notFound();

  // Formation documentée localement : source à privilégier
  const documented = await listMembersByBandId(band.id);

  // Repli externe uniquement si rien n'est encore documenté. Le resolver
  // tolère les pannes de providers (`degraded`).
  const media =
    documented.length === 0
      ? await fetchPublicOrNull(
          `/api/bands/${band.id}/media`,
          bandMediaSchema,
          { revalidate: 3600 },
        )
      : null;

  const external = media?.info.memberships ?? [];
  // Le line-up courant en premier bloc, les anciens membres ensuite :
  // c'est la formation actuelle qu'on vient chercher sur cette page.
  const externalActive = external.filter((m) => !m.ended);
  const externalPast = external.filter((m) => m.ended);

  return (
    <article className="flex flex-col gap-8">
      <nav aria-label="Fil d'Ariane" className="text-muted-foreground text-sm">
        <Link href="/bands" className="hover:text-foreground">
          Groupes
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/bands/${band.slug}`} className="hover:text-foreground">
          {band.name}
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Membres</span>
      </nav>

      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">
          Membres de {band.name}
        </h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm">
          {documented.length > 0
            ? "Formation documentée dans l'encyclopédie. Chaque membre dispose de sa propre fiche."
            : "Aucune formation n'est encore documentée ici : les noms ci-dessous sont lus à la demande depuis MusicBrainz et ne sont pas conservés."}
        </p>
      </header>

      {media?.degraded && (
        <p
          role="status"
          className="border-border text-muted-foreground rounded-md border px-4 py-2 text-sm"
        >
          Certaines sources externes n&apos;ont pas répondu : la liste peut être
          incomplète.
        </p>
      )}

      {documented.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {documented.map((member) => (
            <li key={member.membershipId}>
              <Link
                href={`/members/${member.slug}`}
                className="metal-card hover:bg-accent/30 flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <span className="text-sm font-medium">{member.name}</span>
                <span className="text-muted-foreground text-xs">
                  {member.role ? `${member.role} · ` : ""}
                  {member.joinedYear ?? "?"} – {member.leftYear ?? "…"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : external.length === 0 ? (
        <EmptyState
          title="Aucun membre référencé"
          description={`La formation de ${band.name} n'est pas encore documentée, et MusicBrainz n'en fournit aucune.`}
          ctaHref={`/bands/${band.slug}`}
          ctaLabel="Retour à la fiche du groupe"
        />
      ) : (
        <div className="flex flex-col gap-6">
          {externalActive.length > 0 && (
            <section>
              <h2 className="metal-title text-sm">Formation actuelle</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {externalActive.map((member) => (
                  <ExternalMemberRow key={member.id} member={member} />
                ))}
              </ul>
            </section>
          )}

          {/* Les anciens membres sont repliés : ils peuvent être nombreux
              et ne renseignent pas sur le groupe tel qu'il existe. */}
          {externalPast.length > 0 && (
            <details className="metal-card px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">
                Anciens membres ({externalPast.length})
              </summary>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {externalPast.map((member) => (
                  <ExternalMemberRow key={member.id} member={member} />
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Ligne d'un membre issu de MusicBrainz : pas de fiche interne, donc
 * lien direct vers la source, ouvert dans un nouvel onglet.
 */
function ExternalMemberRow({
  member,
}: {
  member: {
    id: string;
    name: string;
    beginYear: number | null;
    endYear: number | null;
    roles: string[];
  };
}) {
  const period = [member.beginYear, member.endYear].some((y) => y !== null)
    ? `${member.beginYear ?? "?"} – ${member.endYear ?? "…"}`
    : null;

  return (
    <li>
      <a
        href={`https://musicbrainz.org/artist/${member.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="metal-card hover:bg-accent/30 flex items-center justify-between gap-3 px-4 py-3"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {member.name}
          </span>
          {(member.roles.length > 0 || period) && (
            <span className="text-muted-foreground block truncate text-xs">
              {[member.roles.join(", "), period].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs tracking-wide uppercase">
          MusicBrainz ↗
        </span>
      </a>
    </li>
  );
}
