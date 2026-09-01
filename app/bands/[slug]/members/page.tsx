/**
 * Membres d'un groupe (/bands/[slug]/members) — Server Component.
 *
 * Ces données ne sont PAS stockées : il n'existe aucune table
 * `band_members`. Elles sont résolues à la demande depuis MusicBrainz via
 * le resolver média, conformément à la règle du projet — la base ne garde
 * que des références, jamais une copie des données des plateformes.
 *
 * Conséquences assumées :
 * - la page est `noindex` (contenu non maîtrisé, pouvant disparaître) ;
 * - chaque membre pointe vers sa fiche MusicBrainz, source de vérité ;
 * - sans référence MusicBrainz pour le groupe, la liste est simplement vide.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
// Fetch serveur
import { fetchBandBySlug } from "@/hooks/use-bands";
import { fetchPublicOrNull } from "@/lib/api/client";
import { bandMediaSchema } from "@/hooks/api/schemas";
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

  return {
    title: `Membres de ${band.name}`,
    description: `Formation de ${band.name} d'après MusicBrainz.`,
    // Données externes non persistées : on ne les fait pas indexer comme
    // si elles nous appartenaient.
    robots: { index: false, follow: true },
  };
}

export default async function BandMembersPage({ params }: MembersPageProps) {
  const { slug } = await params;
  const band = await fetchBandBySlug(slug);

  if (!band) notFound();

  // Le resolver tolère les pannes de providers (`degraded`) ; on récupère
  // donc soit un DTO éventuellement partiel, soit null si le groupe a
  // disparu entre les deux lectures.
  const media = await fetchPublicOrNull(
    `/api/bands/${band.id}/media`,
    bandMediaSchema,
    { revalidate: 3600 },
  );

  const members = media?.info.members ?? [];

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
          Formation d&apos;après MusicBrainz. Ces informations ne sont pas
          conservées dans l&apos;encyclopédie : elles sont lues à la demande
          depuis la source officielle.
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

      {members.length === 0 ? (
        <EmptyState
          title="Aucun membre référencé"
          description={`Aucune formation n'est disponible pour ${band.name} sur MusicBrainz, ou le groupe n'y est pas encore référencé.`}
          ctaHref={`/bands/${band.slug}`}
          ctaLabel="Retour à la fiche du groupe"
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((member) => (
            <li key={member.id}>
              {/* Lien sortant vers la source : aucune page membre locale
                  n'existe (pas de table `band_members`). */}
              <a
                href={`https://musicbrainz.org/artist/${member.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="metal-card hover:bg-accent/30 flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0 truncate text-sm font-medium">
                  {member.name}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs tracking-wide uppercase">
                  MusicBrainz ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
