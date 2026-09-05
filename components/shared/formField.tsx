/**
 * Primitives de formulaire partagées.
 *
 * Écrites d'abord pour les pages d'authentification, qui étaient les
 * seules du site à ignorer la direction artistique. Elles n'ont
 * pourtant rien de propre à l'authentification : les écrans d'édition
 * du catalogue posent exactement les mêmes questions — un libellé, un
 * champ, une précision dessous, un bouton d'envoi, un message d'échec.
 * D'où leur déménagement ici plutôt qu'une seconde copie.
 */

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/** Classes de champ, réutilisables par les champs composés. */
export const FIELD_CLASS =
  "border-border bg-background focus:border-primary/60 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors";

type FieldFrameProps = {
  label: string;
  /** Précision affichée sous le champ (contraintes, format attendu). */
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
};

/** Cadre commun : libellé au-dessus, précision en dessous. */
function FieldFrame({ label, hint, htmlFor, children }: FieldFrameProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
};

export function FormField({ label, hint, id, ...input }: FormFieldProps) {
  return (
    <FieldFrame label={label} hint={hint} htmlFor={id}>
      <input id={id} className={FIELD_CLASS} {...input} />
    </FieldFrame>
  );
}

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: ReactNode;
};

export function FormTextarea({ label, hint, id, ...area }: FormTextareaProps) {
  return (
    <FieldFrame label={label} hint={hint} htmlFor={id}>
      <textarea id={id} className={FIELD_CLASS} {...area} />
    </FieldFrame>
  );
}

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: ReactNode;
};

export function FormSelect({
  label,
  hint,
  id,
  children,
  ...select
}: FormSelectProps) {
  return (
    <FieldFrame label={label} hint={hint} htmlFor={id}>
      <select id={id} className={FIELD_CLASS} {...select}>
        {children}
      </select>
    </FieldFrame>
  );
}

/** Bouton principal d'un formulaire. */
export function SubmitButton({
  children,
  pending,
  disabled,
}: {
  children: ReactNode;
  /** Désactive et signale l'envoi en cours. */
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="bg-primary text-primary-foreground self-start rounded-md px-4 py-2.5 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
    >
      {children}
    </p>
  );
}
