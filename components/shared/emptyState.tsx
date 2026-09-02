/**
 * <EmptyState> — état vide générique : message + action facultative.
 * Utilisé quand un catalogue ou une recherche ne renvoie rien.
 */

import Link from "next/link";

type EmptyStateProps = {
  /** Titre court de la situation. */
  title: string;
  /** Explication complémentaire. */
  description?: string;
  /** Action principale optionnelle. */
  ctaHref?: string;
  ctaLabel?: string;
};

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: EmptyStateProps) {
  return (
    <div className="metal-card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="metal-title text-base">{title}</p>
      {description && (
        <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      )}
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="bg-primary text-primary-foreground mt-3 rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
