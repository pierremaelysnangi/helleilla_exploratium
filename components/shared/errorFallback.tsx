"use client";

/**
 * <ErrorFallback> — rendu partagé des frontières d'erreur (`error.tsx`).
 *
 * Les segments dupliquaient ce composant à l'identique, et affichaient
 * `error.message` tel quel. Or ce message provient du serveur : il peut
 * contenir un fragment de requête SQL, un chemin interne ou un nom de
 * table. On expose donc le `digest` — l'identifiant que Next génère en
 * production et que l'on retrouve dans les journaux serveur — plutôt que
 * la cause brute.
 */

import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Ce qui n'a pas pu être affiché, pour situer l'échec. */
  scope?: string;
};

export function ErrorFallback({ error, reset, scope }: ErrorFallbackProps) {
  const t = useT();
  return (
    <div
      role="alert"
      className="metal-card flex flex-col items-start gap-3 p-6"
    >
      <h2 className="metal-title text-lg">
        {scope
          ? interpolate(t.common.cannotDisplay, { scope })
          : t.common.errorTitle}
      </h2>
      <p className="text-muted-foreground max-w-prose text-sm">
        {t.common.errorBody}
      </p>

      {/* Identifiant corrélable aux journaux, sans détail technique */}
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          {interpolate(t.common.errorReference, { digest: error.digest })}
        </p>
      )}

      <button
        type="button"
        onClick={reset}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90"
      >
        {t.common.retry}
      </button>
    </div>
  );
}
