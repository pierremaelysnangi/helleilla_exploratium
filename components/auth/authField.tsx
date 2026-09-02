/**
 * Primitives de formulaire des pages d'authentification.
 *
 * Ces pages utilisaient des styles en ligne et les contrôles par défaut
 * du navigateur : elles étaient les seules du site à ignorer la
 * direction artistique. Les classes sont regroupées ici pour que les
 * quatre formulaires (connexion, inscription, oubli et réinitialisation)
 * ne divergent pas.
 */

import type { InputHTMLAttributes, ReactNode } from "react";

/** Classes de champ, réutilisables par les champs composés (mot de passe). */
export const FIELD_CLASS =
  "border-border bg-background focus:border-primary/60 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Précision affichée sous le champ (contraintes, format attendu). */
  hint?: ReactNode;
};

export function AuthField({ label, hint, id, ...input }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input id={id} className={FIELD_CLASS} {...input} />
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

/** Bouton principal d'un formulaire d'authentification. */
export function AuthSubmit({
  children,
  pending,
}: {
  children: ReactNode;
  /** Désactive et signale l'envoi en cours. */
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/**
 * Message d'erreur d'un formulaire.
 *
 * `role="alert"` : l'échec doit être annoncé, pas seulement affiché —
 * une personne qui navigue au lecteur d'écran ne verrait rien sinon.
 */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
    >
      {children}
    </p>
  );
}
