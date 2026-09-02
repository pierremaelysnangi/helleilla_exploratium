/**
 * <AccessNotice> — message affiché à un utilisateur connecté qui n'a pas
 * le rôle requis.
 *
 * Volontairement explicite : dire « accès refusé » sans dire quel rôle
 * manque ni comment l'obtenir laisse la personne sans recours. Ici le
 * rôle contributeur s'acquiert auprès d'un administrateur, pas en
 * s'inscrivant — autant l'écrire.
 */

import Link from "next/link";

type AccessNoticeProps = {
  title: string;
  description: string;
};

export function AccessNotice({ title, description }: AccessNoticeProps) {
  return (
    <div className="metal-card flex flex-col items-start gap-3 p-6">
      <h2 className="metal-title text-lg">{title}</h2>
      <p className="max-w-prose text-sm leading-relaxed">{description}</p>
      <Link
        href="/about"
        className="border-border hover:bg-accent/30 rounded-md border px-4 py-2 text-sm font-semibold tracking-wide uppercase"
      >
        Comment fonctionnent les contributions
      </Link>
    </div>
  );
}
